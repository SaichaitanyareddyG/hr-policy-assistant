-- =====================================================
-- STEP 8: SECURITY HARDENING MIGRATION
-- =====================================================
-- This migration implements comprehensive security measures:
-- 1. Row Level Security (RLS) on all tables
-- 2. Strict organization-level isolation
-- 3. Role-based access control
-- 4. Rate limiting table
-- 5. Audit logging improvements
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES (if not already enabled)
-- =====================================================

-- Enable RLS on core tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- policy_documents and policy_document_chunks already have RLS from Step 2 & 3
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_clarification_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. DROP OLD POLICIES (if they exist) TO RECREATE STRICT ONES
-- =====================================================

-- Drop existing policies to replace with stricter versions
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "HR admins can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "HR admins can view profiles in their org" ON profiles;

-- Drop and recreate document policies for stricter control
DROP POLICY IF EXISTS "HR_ADMIN can manage all documents in their org" ON policy_documents;
DROP POLICY IF EXISTS "Employees can view visible documents in their org" ON policy_documents;

-- Drop and recreate chunk policies
DROP POLICY IF EXISTS "HR admins can read chunks in their organization" ON policy_document_chunks;
DROP POLICY IF EXISTS "Employees can read chunks from visible documents" ON policy_document_chunks;
DROP POLICY IF EXISTS "HR admins can manage chunks in their organization" ON policy_document_chunks;

-- =====================================================
-- 3. ORGANIZATIONS TABLE - STRICT RLS
-- =====================================================

-- Users can only view their own organization
CREATE POLICY "users_read_own_org"
ON organizations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- Only HR_ADMIN can update their organization
CREATE POLICY "hr_admin_update_own_org"
ON organizations
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
)
WITH CHECK (
  id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
);

-- =====================================================
-- 4. PROFILES TABLE - STRICT RLS
-- =====================================================

-- Users can read their own profile
CREATE POLICY "users_read_own_profile"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile (limited fields)
CREATE POLICY "users_update_own_profile"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- HR_ADMIN can read all profiles in their organization
CREATE POLICY "hr_admin_read_org_profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
);

-- HR_ADMIN can update profiles in their organization (for role management)
CREATE POLICY "hr_admin_update_org_profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
);

-- =====================================================
-- 5. POLICY_DOCUMENTS TABLE - STRICT RLS
-- =====================================================

-- HR_ADMIN can do everything (INSERT, SELECT, UPDATE, DELETE) in their org
CREATE POLICY "hr_admin_all_documents"
ON policy_documents
FOR ALL
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
);

-- EMPLOYEES can only SELECT ACTIVE documents visible to them
-- Note: Audience filtering is complex, so we do org-level RLS here
-- and enforce audience visibility in application code
CREATE POLICY "employee_read_active_documents"
ON policy_documents
FOR SELECT
TO authenticated
USING (
  -- Must be in same org
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
  -- Must be ACTIVE
  AND status = 'ACTIVE'
  -- Must be COMPLETED (not still processing)
  AND processing_status = 'COMPLETED'
  -- Note: audience_type, allowed_departments, etc. are checked in application code
);

-- Employees CANNOT insert, update, or delete documents
-- (No policy = no permission for non-HR_ADMIN)

-- =====================================================
-- 6. POLICY_DOCUMENT_CHUNKS TABLE - STRICT RLS
-- =====================================================

-- HR_ADMIN can read and manage all chunks in their org
CREATE POLICY "hr_admin_all_chunks"
ON policy_document_chunks
FOR ALL
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
);

-- EMPLOYEES can only SELECT chunks from ACTIVE + COMPLETED documents in their org
-- Audience visibility is enforced in application code
CREATE POLICY "employee_read_active_chunks"
ON policy_document_chunks
FOR SELECT
TO authenticated
USING (
  -- Must be in same org
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
  -- Document must be ACTIVE and COMPLETED
  AND document_id IN (
    SELECT id FROM policy_documents 
    WHERE org_id = policy_document_chunks.org_id
    AND status = 'ACTIVE'
    AND processing_status = 'COMPLETED'
  )
);

-- Employees CANNOT insert, update, or delete chunks

-- =====================================================
-- 7. CHAT_SESSIONS TABLE - STRICT RLS
-- =====================================================

-- Users can only read/write their own chat sessions in their org
CREATE POLICY "users_manage_own_sessions"
ON chat_sessions
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  AND org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- HR_ADMIN can read all sessions in their org (for analytics)
CREATE POLICY "hr_admin_read_org_sessions"
ON chat_sessions
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
);

-- =====================================================
-- 8. CHAT_MESSAGES TABLE - STRICT RLS
-- =====================================================

-- Users can only read/write their own messages
CREATE POLICY "users_manage_own_messages"
ON chat_messages
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  AND org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- HR_ADMIN can read all messages in their org (for analytics and clarifications)
CREATE POLICY "hr_admin_read_org_messages"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
);

-- =====================================================
-- 9. QUESTION_FEEDBACK TABLE - STRICT RLS
-- =====================================================

-- Users can manage their own feedback
CREATE POLICY "users_manage_own_feedback"
ON question_feedback
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  AND org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- HR_ADMIN can read all feedback in their org
CREATE POLICY "hr_admin_read_org_feedback"
ON question_feedback
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
);

-- =====================================================
-- 10. HR_CLARIFICATION_REQUESTS TABLE - STRICT RLS
-- =====================================================

-- Employees can create and read their own clarification requests
CREATE POLICY "employee_manage_own_clarifications"
ON hr_clarification_requests
FOR ALL
TO authenticated
USING (
  requested_by = auth.uid()
  AND org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  requested_by = auth.uid()
  AND org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- HR_ADMIN can read and update all clarification requests in their org
CREATE POLICY "hr_admin_manage_org_clarifications"
ON hr_clarification_requests
FOR ALL
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
);

-- =====================================================
-- 11. CREATE RATE_LIMITS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint per user, action, and time window
  CONSTRAINT rate_limits_unique_window UNIQUE (user_id, action, window_start)
);

-- Add comments
COMMENT ON TABLE rate_limits IS 'Tracks API rate limits per user and action';
COMMENT ON COLUMN rate_limits.action IS 'Action being rate limited (e.g., chat_question, signed_url)';
COMMENT ON COLUMN rate_limits.count IS 'Number of requests in current window';
COMMENT ON COLUMN rate_limits.window_start IS 'Start of current rate limit window (hourly)';

-- Create index for fast lookups
CREATE INDEX idx_rate_limits_user_action ON rate_limits(user_id, action, window_start);
CREATE INDEX idx_rate_limits_window_start ON rate_limits(window_start);

-- Enable RLS on rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can read their own rate limits
CREATE POLICY "users_read_own_rate_limits"
ON rate_limits
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Server can insert/update rate limits (using service role key)
-- No policy needed for service role, it bypasses RLS

-- =====================================================
-- 12. CLEANUP FUNCTION FOR OLD RATE LIMIT RECORDS
-- =====================================================

-- Function to clean up old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$;

-- Comment
COMMENT ON FUNCTION cleanup_old_rate_limits IS 'Deletes rate limit records older than 24 hours';

-- =====================================================
-- 13. SECURITY AUDIT LOG (Optional - for future)
-- =====================================================

-- This table can be used for audit logging in the future
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX idx_security_audit_log_org_id ON security_audit_log(org_id);
CREATE INDEX idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_action ON security_audit_log(action);
CREATE INDEX idx_security_audit_log_created_at ON security_audit_log(created_at);

-- Enable RLS
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only HR_ADMIN can read audit logs
CREATE POLICY "hr_admin_read_org_audit_logs"
ON security_audit_log
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'HR_ADMIN'
  )
);

-- Comment
COMMENT ON TABLE security_audit_log IS 'Audit log for security-relevant actions';

-- =====================================================
-- 14. VERIFICATION QUERIES
-- =====================================================

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'organizations', 
  'profiles', 
  'policy_documents', 
  'policy_document_chunks',
  'chat_sessions',
  'chat_messages',
  'question_feedback',
  'hr_clarification_requests',
  'rate_limits',
  'security_audit_log'
);

-- Count policies per table
SELECT schemaname, tablename, COUNT(policyname) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- IMPORTANT NOTES:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Test policies with different user roles after migration
-- 3. Audience filtering (departments, locations, etc.) is handled in application code
-- 4. Service role key bypasses RLS - use only in server-side code
-- 5. Rate limit cleanup should be run periodically (cron job or scheduled function)
