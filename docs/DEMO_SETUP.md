# PolicyPal AI - Demo Setup Instructions

This guide helps you set up demo data for showcasing PolicyPal AI.

## Overview

Demo mode allows potential users to experience the platform without creating their own organization. The demo includes:
- A demo organization
- Multiple user roles (ORG_ADMIN, DEPARTMENT_ADMIN, EMPLOYEE)
- Sample policy documents
- Pre-approved FAQs
- Realistic data scenarios

## Demo Credentials

### Demo Admin Account
- **Organization**: Demo Corp
- **Email**: `demo-admin@democorp.com`
- **Password**: `Demo123!@#`
- **Role**: ORG_ADMIN
- **Access**: Full admin dashboard

### Demo Department Admin
- **Email**: `demo-hr@democorp.com`
- **Password**: `Demo123!@#`
- **Role**: DEPARTMENT_ADMIN (HR scope)
- **Access**: Limited admin features

### Demo Employee
- **Email**: `demo-employee@democorp.com`
- **Password**: `Demo123!@#`
- **Role**: EMPLOYEE
- **Access**: Employee chat interface

### Demo Manager
- **Email**: `demo-manager@democorp.com`
- **Password**: `Demo123!@#`
- **Role**: EMPLOYEE
- **Department**: Engineering

### Demo Intern
- **Email**: `demo-intern@democorp.com`
- **Password**: `Demo123!@#`
- **Role**: EMPLOYEE
- **Employment Type**: Intern

## Setup Steps

### 1. Create Demo Organization

```sql
-- Run this in Supabase SQL Editor

-- Create demo organization
INSERT INTO organizations (id, name, created_at)
VALUES ('demo-org-uuid-1234', 'Demo Corp', NOW())
ON CONFLICT (id) DO NOTHING;
```

### 2. Create Demo Users

```sql
-- Note: This requires Supabase Auth API or manual creation through Supabase dashboard

-- After creating auth users in Supabase Auth, create profiles:

-- Demo Admin
INSERT INTO profiles (id, org_id, email, full_name, role, department, location, employment_type)
VALUES (
  '[AUTH_USER_ID_1]',
  'demo-org-uuid-1234',
  'demo-admin@democorp.com',
  'Alex Admin',
  'ORG_ADMIN',
  'Executive',
  'San Francisco, CA',
  'Full-Time'
) ON CONFLICT (id) DO NOTHING;

-- Demo HR Department Admin
INSERT INTO profiles (id, org_id, email, full_name, role, department_scope, department, location, employment_type)
VALUES (
  '[AUTH_USER_ID_2]',
  'demo-org-uuid-1234',
  'demo-hr@democorp.com',
  'Hannah HR',
  'DEPARTMENT_ADMIN',
  'HR',
  'HR',
  'San Francisco, CA',
  'Full-Time'
) ON CONFLICT (id) DO NOTHING;

-- Demo Employee
INSERT INTO profiles (id, org_id, email, full_name, role, department, location, employment_type)
VALUES (
  '[AUTH_USER_ID_3]',
  'demo-org-uuid-1234',
  'demo-employee@democorp.com',
  'Emma Employee',
  'EMPLOYEE',
  'Marketing',
  'New York, NY',
  'Full-Time'
) ON CONFLICT (id) DO NOTHING;

-- Demo Manager
INSERT INTO profiles (id, org_id, email, full_name, role, department, location, employment_type)
VALUES (
  '[AUTH_USER_ID_4]',
  'demo-org-uuid-1234',
  'demo-manager@democorp.com',
  'Mike Manager',
  'EMPLOYEE',
  'Engineering',
  'Austin, TX',
  'Full-Time'
) ON CONFLICT (id) DO NOTHING;

-- Demo Intern
INSERT INTO profiles (id, org_id, email, full_name, role, department, location, employment_type)
VALUES (
  '[AUTH_USER_ID_5]',
  'demo-org-uuid-1234',
  'demo-intern@democorp.com',
  'Ian Intern',
  'EMPLOYEE',
  'Engineering',
  'Remote',
  'Intern'
) ON CONFLICT (id) DO NOTHING;
```

### 3. Create Sample Policy Documents

Upload these sample PDFs through the admin interface or via SQL:

**Required Sample Documents**:
1. **Employee Handbook** (ALL employees)
   - Contains: Code of conduct, dress code, workplace policies
   
2. **Benefits Guide** (ALL employees)
   - Contains: Health insurance, 401(k), PTO policies
   
3. **Remote Work Policy** (ALL employees)
   - Contains: WFH guidelines, equipment, communication

4. **Executive Compensation** (RESTRICTED: Executive department only)
   - Contains: Exec bonus structure, stock options
   
5. **Engineering Onboarding** (RESTRICTED: Engineering department)
   - Contains: Dev setup, tools, processes

**SQL to create demo documents**:

```sql
-- Demo documents (without actual file uploads - add files manually)
INSERT INTO policy_documents (org_id, title, file_name, file_path, status, audience_type, processing_status)
VALUES 
  ('demo-org-uuid-1234', 'Employee Handbook', 'employee-handbook.pdf', 'demo/employee-handbook.pdf', 'ACTIVE', 'ALL', 'COMPLETED'),
  ('demo-org-uuid-1234', 'Benefits Guide', 'benefits-guide.pdf', 'demo/benefits-guide.pdf', 'ACTIVE', 'ALL', 'COMPLETED'),
  ('demo-org-uuid-1234', 'Remote Work Policy', 'remote-work-policy.pdf', 'demo/remote-work.pdf', 'ACTIVE', 'ALL', 'COMPLETED'),
  ('demo-org-uuid-1234', 'Executive Compensation', 'exec-comp.pdf', 'demo/exec-comp.pdf', 'ACTIVE', 'RESTRICTED', 'COMPLETED'),
  ('demo-org-uuid-1234', 'Engineering Onboarding', 'eng-onboarding.pdf', 'demo/eng-onboarding.pdf', 'ACTIVE', 'RESTRICTED', 'COMPLETED');

-- Update restricted documents with audience rules
UPDATE policy_documents
SET allowed_departments = ARRAY['Executive']
WHERE title = 'Executive Compensation' AND org_id = 'demo-org-uuid-1234';

UPDATE policy_documents
SET allowed_departments = ARRAY['Engineering']
WHERE title = 'Engineering Onboarding' AND org_id = 'demo-org-uuid-1234';
```

### 4. Create Sample FAQs

```sql
INSERT INTO approved_faqs (org_id, question, answer, category, audience_type, status)
VALUES 
  (
    'demo-org-uuid-1234',
    'How many vacation days do I get?',
    'Full-time employees receive 15 days of PTO per year, which increases to 20 days after 3 years of service. PTO accrues monthly and can be used for vacation, sick leave, or personal days.',
    'Benefits',
    'ALL',
    'ACTIVE'
  ),
  (
    'demo-org-uuid-1234',
    'What is the remote work policy?',
    'Employees can work remotely up to 3 days per week with manager approval. Full remote work requires VP approval and is evaluated on a case-by-case basis. All remote workers must maintain core hours of 10am-3pm PT.',
    'Remote Work',
    'ALL',
    'ACTIVE'
  ),
  (
    'demo-org-uuid-1234',
    'When do I get my 401k match?',
    'The company matches 50% of your contributions up to 6% of your salary. The match vests over 4 years at 25% per year. You must be employed for 6 months to be eligible.',
    'Benefits',
    'ALL',
    'ACTIVE'
  ),
  (
    'demo-org-uuid-1234',
    'What is the dress code?',
    'We have a business casual dress code. Jeans are acceptable Monday-Thursday. Fridays are casual. Client-facing meetings require business attire.',
    'Workplace',
    'ALL',
    'ACTIVE'
  );
```

### 5. Create Sample Chat History (Optional)

```sql
-- Create a demo chat session
INSERT INTO chat_sessions (id, org_id, user_id, title)
VALUES (
  'demo-session-1',
  'demo-org-uuid-1234',
  '[DEMO_EMPLOYEE_AUTH_ID]',
  'Questions about PTO and benefits'
);

-- Add sample messages
INSERT INTO chat_messages (session_id, org_id, user_id, role, content, confidence)
VALUES 
  (
    'demo-session-1',
    'demo-org-uuid-1234',
    '[DEMO_EMPLOYEE_AUTH_ID]',
    'user',
    'How many vacation days do I get?',
    'High'
  ),
  (
    'demo-session-1',
    'demo-org-uuid-1234',
    '[DEMO_EMPLOYEE_AUTH_ID]',
    'assistant',
    'Full-time employees receive 15 days of PTO per year...',
    'High'
  );
```

## Testing Demo Mode

### As Demo Admin
1. Log in with demo-admin@democorp.com
2. Verify access to all admin features
3. Test user management
4. View audit logs
5. Check security dashboard
6. Create a test FAQ

### As Demo Department Admin
1. Log in with demo-hr@democorp.com
2. Verify limited admin access
3. Try to invite employee (should work)
4. Try to invite ORG_ADMIN (should fail)
5. View department-specific audit logs

### As Demo Employee
1. Log in with demo-employee@democorp.com
2. Ask questions in chat
3. Verify FAQ answers appear first
4. Check that restricted documents are not accessible
5. Try to access /admin (should redirect)

## Demo Mode Features

### Show Demo Badge
To indicate demo mode, add a banner to the UI:

```tsx
// Add to app/layout.tsx or admin/layout.tsx
{process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
  <div className="bg-yellow-500 text-center py-2 text-sm font-medium">
    🎭 Demo Mode - Sample data only
  </div>
)}
```

### Demo Login Buttons

Add these to the login page for easy access:

```tsx
<div className="mt-6 space-y-2">
  <p className="text-sm text-center text-gray-600">Quick Demo Access:</p>
  <div className="flex gap-2">
    <Button variant="outline" onClick={() => demoLogin('admin')}>
      Try as Admin
    </Button>
    <Button variant="outline" onClick={() => demoLogin('employee')}>
      Try as Employee
    </Button>
  </div>
</div>
```

## Security Notes

⚠️ **IMPORTANT**: Demo mode should only be enabled in non-production environments.

- Demo users should not have access to real organization data
- Demo organization should be clearly marked
- Demo credentials should be rotated regularly
- Consider adding auto-cleanup for demo data older than 30 days

## Cleanup Demo Data

To remove all demo data:

```sql
-- Delete demo organization and cascade all related data
DELETE FROM organizations WHERE id = 'demo-org-uuid-1234';

-- RLS policies will automatically prevent cross-org access
```

## Environment Variables

Add to `.env.local`:

```env
# Enable demo mode (optional)
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_ORG_ID=demo-org-uuid-1234
```

## Automated Demo Reset

For continuous demos, set up a cron job to reset demo data daily:

```bash
# reset-demo.sh
#!/bin/bash

# Delete demo chat sessions
psql $DATABASE_URL -c "DELETE FROM chat_sessions WHERE org_id = 'demo-org-uuid-1234'"

# Reset demo FAQs
psql $DATABASE_URL -c "DELETE FROM approved_faqs WHERE org_id = 'demo-org-uuid-1234' AND created_at < NOW() - INTERVAL '1 day'"

# Clean up demo audit logs
psql $DATABASE_URL -c "DELETE FROM audit_logs WHERE org_id = 'demo-org-uuid-1234' AND created_at < NOW() - INTERVAL '7 days'"

echo "Demo data reset complete"
```

## Sample Documents to Upload

Create these simple PDFs for demo purposes:

1. **employee-handbook.pdf**: 2-3 pages about company culture, dress code, workplace conduct
2. **benefits-guide.pdf**: 2-3 pages about health insurance, 401k, PTO policies
3. **remote-work-policy.pdf**: 1-2 pages about WFH guidelines
4. **exec-comp.pdf**: 1 page about executive compensation (restricted)
5. **eng-onboarding.pdf**: 2 pages about engineering setup (restricted)

These can be simple Word/Google Docs exported to PDF with lorem ipsum or basic policy text.

## Demo Scenarios to Test

1. **Employee asks common question** → FAQ answer appears instantly
2. **Employee asks specific question** → RAG retrieves from policy docs
3. **Employee tries to access restricted doc** → Access denied
4. **Admin invites new user** → Invitation created, email sent
5. **Department Admin tries to invite admin** → Permission denied
6. **View audit logs** → Recent actions visible
7. **Check security dashboard** → All systems green

## Demo Presentation Tips

- Start with employee view to show end-user experience
- Switch to admin view to show management features
- Highlight security features (RLS, signed URLs, audience targeting)
- Show FAQ system with instant answers
- Demonstrate audit logging and security dashboard
- Emphasize zero-config AI (no training required)

---

**Demo is ready!** Use these credentials to showcase PolicyPal AI to potential users and stakeholders.
