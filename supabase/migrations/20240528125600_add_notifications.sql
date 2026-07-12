-- =====================================================
-- Step 6: HR Analytics, Unanswered Questions & Feedback
-- =====================================================
-- This migration adds analytics, feedback, and clarification
-- tracking to help HR understand employee questions better.

-- 1. Update chat_messages table to track unanswered questions
-- =====================================================
-- Add is_unanswered column if not exists
alter table chat_messages
add column if not exists is_unanswered boolean default false;

-- Add index for unanswered queries
create index if not exists chat_messages_is_unanswered_idx
on chat_messages (org_id, is_unanswered)
where is_unanswered = true;

-- 2. Create question_feedback table
-- =====================================================
create table if not exists question_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references chat_messages(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  feedback text not null check (feedback in ('HELPFUL', 'NOT_HELPFUL')),
  comment text,
  created_at timestamp with time zone default now(),
  
  -- Prevent duplicate feedback from same user for same message
  unique(message_id, user_id)
);

-- Indexes for feedback queries
create index if not exists question_feedback_message_id_idx
on question_feedback (message_id);

create index if not exists question_feedback_org_id_idx
on question_feedback (org_id, created_at desc);

create index if not exists question_feedback_feedback_idx
on question_feedback (org_id, feedback);

-- 3. Create hr_clarification_requests table
-- =====================================================
create table if not exists hr_clarification_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  employee_id uuid not null references profiles(id) on delete cascade,
  question text not null,
  ai_answer text,
  assistant_message_id uuid references chat_messages(id) on delete set null,
  status text not null default 'OPEN' check (status in ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED')),
  hr_response text,
  assigned_to uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  resolved_at timestamp with time zone,
  updated_at timestamp with time zone default now()
);

-- Indexes for clarification queries
create index if not exists hr_clarification_requests_org_id_idx
on hr_clarification_requests (org_id, status, created_at desc);

create index if not exists hr_clarification_requests_employee_id_idx
on hr_clarification_requests (employee_id, created_at desc);

create index if not exists hr_clarification_requests_status_idx
on hr_clarification_requests (status);

create index if not exists hr_clarification_requests_assigned_to_idx
on hr_clarification_requests (assigned_to)
where assigned_to is not null;

-- Trigger to update updated_at timestamp
create or replace function update_hr_clarification_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_hr_clarification_updated_at_trigger
before update on hr_clarification_requests
for each row
execute function update_hr_clarification_updated_at();

-- 4. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on new tables
alter table question_feedback enable row level security;
alter table hr_clarification_requests enable row level security;

-- question_feedback policies
-- Employees can view and create their own feedback
create policy "Employees can view their own feedback"
on question_feedback for select
using (auth.uid() = user_id);

create policy "Employees can create their own feedback"
on question_feedback for insert
with check (auth.uid() = user_id);

-- HR admins can view all feedback in their org
create policy "HR admins can view org feedback"
on question_feedback for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'HR_ADMIN'
    and profiles.org_id = question_feedback.org_id
  )
);

-- hr_clarification_requests policies
-- Employees can view their own requests
create policy "Employees can view their own clarification requests"
on hr_clarification_requests for select
using (auth.uid() = employee_id);

-- Employees can create requests for their org
create policy "Employees can create clarification requests"
on hr_clarification_requests for insert
with check (
  auth.uid() = employee_id
  and exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.org_id = hr_clarification_requests.org_id
  )
);

-- HR admins can view all requests in their org
create policy "HR admins can view org clarification requests"
on hr_clarification_requests for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'HR_ADMIN'
    and profiles.org_id = hr_clarification_requests.org_id
  )
);

-- HR admins can update requests in their org
create policy "HR admins can update org clarification requests"
on hr_clarification_requests for update
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'HR_ADMIN'
    and profiles.org_id = hr_clarification_requests.org_id
  )
);

-- 5. Helper Functions for Analytics
-- =====================================================

-- Get analytics summary for an organization
create or replace function get_analytics_summary(org_uuid uuid)
returns table (
  total_questions bigint,
  unanswered_questions bigint,
  helpful_feedback bigint,
  not_helpful_feedback bigint,
  helpful_rate numeric,
  total_documents bigint,
  total_employees bigint,
  total_clarifications bigint,
  open_clarifications bigint
)
language sql
stable
as $$
  select
    -- Total questions (user role messages)
    (select count(*) from chat_messages where org_id = org_uuid and role = 'user'),
    
    -- Unanswered questions (assistant messages marked as unanswered)
    (select count(*) from chat_messages where org_id = org_uuid and role = 'assistant' and is_unanswered = true),
    
    -- Helpful feedback count
    (select count(*) from question_feedback where org_id = org_uuid and feedback = 'HELPFUL'),
    
    -- Not helpful feedback count
    (select count(*) from question_feedback where org_id = org_uuid and feedback = 'NOT_HELPFUL'),
    
    -- Helpful rate (percentage)
    case
      when (select count(*) from question_feedback where org_id = org_uuid) > 0 then
        round(
          (select count(*)::numeric from question_feedback where org_id = org_uuid and feedback = 'HELPFUL') /
          (select count(*)::numeric from question_feedback where org_id = org_uuid) * 100,
          2
        )
      else
        0
    end,
    
    -- Total active policy documents
    (select count(*) from policy_documents where org_id = org_uuid and status = 'ACTIVE'),
    
    -- Total employees
    (select count(*) from profiles where org_id = org_uuid),
    
    -- Total clarification requests
    (select count(*) from hr_clarification_requests where org_id = org_uuid),
    
    -- Open clarification requests
    (select count(*) from hr_clarification_requests where org_id = org_uuid and status = 'OPEN');
$$;

grant execute on function get_analytics_summary to authenticated;

-- Get top asked questions
create or replace function get_top_questions(org_uuid uuid, limit_count int default 10)
returns table (
  question text,
  question_count bigint,
  last_asked timestamp with time zone
)
language sql
stable
as $$
  select
    content as question,
    count(*) as question_count,
    max(created_at) as last_asked
  from chat_messages
  where org_id = org_uuid
  and role = 'user'
  and length(trim(content)) > 0
  group by content
  order by question_count desc, last_asked desc
  limit limit_count;
$$;

grant execute on function get_top_questions to authenticated;

-- 6. Comments for documentation
-- =====================================================

comment on table question_feedback is 
'Stores employee feedback (helpful/not helpful) on AI assistant responses';

comment on table hr_clarification_requests is 
'Tracks employee questions that need HR clarification or where AI answer was insufficient';

comment on column chat_messages.is_unanswered is 
'Flag indicating AI could not find an answer to the question';

comment on column question_feedback.feedback is 
'Employee feedback: HELPFUL or NOT_HELPFUL';

comment on column hr_clarification_requests.status is 
'Status: OPEN, IN_REVIEW, RESOLVED, or DISMISSED';

-- =====================================================
-- Migration Complete
-- =====================================================
-- Next steps:
-- 1. HR can view analytics at /admin/analytics
-- 2. HR can manage clarifications at /admin/clarifications
-- 3. Employees can provide feedback on answers
-- 4. Employees can ask HR for clarification
