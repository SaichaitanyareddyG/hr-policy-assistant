-- =====================================================
-- ONBOARDING & INVITATION SYSTEM MIGRATION
-- =====================================================
-- This migration implements secure invite-based onboarding:
-- 1. Updates role system (ORG_ADMIN, DEPARTMENT_ADMIN, EMPLOYEE)
-- 2. Adds department_scope for DEPARTMENT_ADMIN
-- 3. Creates invitations table
-- 4. Updates RLS policies for new roles
-- =====================================================

-- =====================================================
-- 1. UPDATE PROFILES TABLE WITH NEW ROLES
-- =====================================================

-- First, update existing HR_ADMIN to ORG_ADMIN
UPDATE profiles 
SET role = 'ORG_ADMIN' 
WHERE role = 'HR_ADMIN';

-- Drop old role constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new role constraint with 3 roles
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN', 'EMPLOYEE'));

-- Add department_scope column for DEPARTMENT_ADMIN
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS department_scope TEXT;

-- Add constraint for department_scope values
ALTER TABLE profiles
ADD CONSTRAINT profiles_department_scope_check
CHECK (
  department_scope IS NULL OR 
  department_scope IN ('HR', 'FINANCE', 'IT', 'OPS', 'LEGAL')
);

-- Add comments
COMMENT ON COLUMN profiles.role IS 'User role: ORG_ADMIN (full admin), DEPARTMENT_ADMIN (dept-level admin), EMPLOYEE (regular user)';
COMMENT ON COLUMN profiles.department_scope IS 'For DEPARTMENT_ADMIN only: which department they manage (HR, FINANCE, IT, OPS, LEGAL)';

-- =====================================================
-- 2. CREATE INVITATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL,
  department_scope TEXT,
  department TEXT,
  location TEXT,
  employment_type TEXT,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT invitations_role_check CHECK (role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN', 'EMPLOYEE')),
  CONSTRAINT invitations_status_check CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
  CONSTRAINT invitations_department_scope_check CHECK (
    department_scope IS NULL OR 
    department_scope IN ('HR', 'FINANCE', 'IT', 'OPS', 'LEGAL')
  )
);

-- Create indexes
CREATE INDEX idx_invitations_org_id ON invitations(org_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_invited_by ON invitations(invited_by);

-- Add comments
COMMENT ON TABLE invitations IS 'User invitations for joining organizations';
COMMENT ON COLUMN invitations.token IS 'Unique random token for invitation link';
COMMENT ON COLUMN invitations.status IS 'PENDING, ACCEPTED, EXPIRED, or REVOKED';
COMMENT ON COLUMN invitations.expires_at IS 'When invitation expires (typically 7 days)';
COMMENT ON COLUMN invitations.department_scope IS 'For DEPARTMENT_ADMIN invitations only';

-- =====================================================
-- 3. ENABLE RLS ON INVITATIONS TABLE
-- =====================================================

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ORG_ADMIN can manage all invitations in their org
CREATE POLICY "org_admin_manage_invitations"
ON invitations
FOR ALL
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'ORG_ADMIN'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'ORG_ADMIN'
  )
);

-- DEPARTMENT_ADMIN can view invitations they created (for EMPLOYEE only)
CREATE POLICY "dept_admin_view_own_invitations"
ON invitations
FOR SELECT
TO authenticated
USING (
  invited_by = auth.uid()
  AND role = 'EMPLOYEE'
  AND org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'DEPARTMENT_ADMIN'
  )
);

-- DEPARTMENT_ADMIN can create EMPLOYEE invitations only
CREATE POLICY "dept_admin_create_employee_invitations"
ON invitations
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'EMPLOYEE'
  AND org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'DEPARTMENT_ADMIN'
  )
);

-- Public read access for invitation validation (by token)
-- This allows the invite accept page to verify tokens
CREATE POLICY "public_read_invitation_by_token"
ON invitations
FOR SELECT
TO anon
USING (status = 'PENDING' AND expires_at > NOW());

-- =====================================================
-- 4. UPDATE RLS POLICIES FOR NEW ROLES
-- =====================================================

-- Drop old HR_ADMIN-specific policies and recreate with ORG_ADMIN + DEPARTMENT_ADMIN

-- Organizations table
DROP POLICY IF EXISTS "hr_admin_update_own_org" ON organizations;

CREATE POLICY "org_admin_update_own_org"
ON organizations
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'ORG_ADMIN'
  )
)
WITH CHECK (
  id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'ORG_ADMIN'
  )
);

-- Profiles table - update existing policies
DROP POLICY IF EXISTS "hr_admin_read_org_profiles" ON profiles;
DROP POLICY IF EXISTS "hr_admin_update_org_profiles" ON profiles;

-- ORG_ADMIN can read and update all profiles in their org
CREATE POLICY "org_admin_read_org_profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'ORG_ADMIN'
  )
);

CREATE POLICY "org_admin_update_org_profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'ORG_ADMIN'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'ORG_ADMIN'
  )
);

-- DEPARTMENT_ADMIN can read profiles in their org
CREATE POLICY "dept_admin_read_org_profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'DEPARTMENT_ADMIN'
  )
);

-- Policy documents - update to allow DEPARTMENT_ADMIN access
DROP POLICY IF EXISTS "hr_admin_all_documents" ON policy_documents;

-- ORG_ADMIN has full access
CREATE POLICY "org_admin_all_documents"
ON policy_documents
FOR ALL
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'ORG_ADMIN'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'ORG_ADMIN'
  )
);

-- DEPARTMENT_ADMIN can read and manage documents in their org
CREATE POLICY "dept_admin_manage_documents"
ON policy_documents
FOR ALL
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'DEPARTMENT_ADMIN'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'DEPARTMENT_ADMIN'
  )
);

-- Policy document chunks - update for DEPARTMENT_ADMIN
DROP POLICY IF EXISTS "hr_admin_all_chunks" ON policy_document_chunks;

CREATE POLICY "org_admin_all_chunks"
ON policy_document_chunks
FOR ALL
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'ORG_ADMIN'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'ORG_ADMIN'
  )
);

CREATE POLICY "dept_admin_all_chunks"
ON policy_document_chunks
FOR ALL
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'DEPARTMENT_ADMIN'
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role = 'DEPARTMENT_ADMIN'
  )
);

-- Chat sessions - ORG_ADMIN and DEPARTMENT_ADMIN can read all
DROP POLICY IF EXISTS "hr_admin_read_org_sessions" ON chat_sessions;

CREATE POLICY "admin_read_org_sessions"
ON chat_sessions
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN')
  )
);

-- Chat messages - ORG_ADMIN and DEPARTMENT_ADMIN can read all
DROP POLICY IF EXISTS "hr_admin_read_org_messages" ON chat_messages;

CREATE POLICY "admin_read_org_messages"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN')
  )
);

-- Question feedback - ORG_ADMIN and DEPARTMENT_ADMIN can read all
DROP POLICY IF EXISTS "hr_admin_read_org_feedback" ON question_feedback;

CREATE POLICY "admin_read_org_feedback"
ON question_feedback
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN')
  )
);

-- HR clarification requests - ORG_ADMIN and DEPARTMENT_ADMIN can manage
DROP POLICY IF EXISTS "hr_admin_manage_org_clarifications" ON hr_clarification_requests;

CREATE POLICY "admin_manage_org_clarifications"
ON hr_clarification_requests
FOR ALL
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN')
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN')
  )
);

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to check if a user is an admin (ORG_ADMIN or DEPARTMENT_ADMIN)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN')
  );
END;
$$;

-- Function to check if a user is ORG_ADMIN
CREATE OR REPLACE FUNCTION is_org_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role = 'ORG_ADMIN'
  );
END;
$$;

-- Function to mark expired invitations
CREATE OR REPLACE FUNCTION mark_expired_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE invitations
  SET status = 'EXPIRED'
  WHERE status = 'PENDING'
  AND expires_at < NOW();
END;
$$;

COMMENT ON FUNCTION mark_expired_invitations IS 'Marks pending invitations as expired if past expiry date';

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Verify role update
SELECT role, COUNT(*) 
FROM profiles 
GROUP BY role;

-- Verify invitations table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'invitations'
) AS invitations_table_exists;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'invitations';

-- Count policies on invitations table
SELECT COUNT(*) as invitation_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'invitations';

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- IMPORTANT NOTES:
-- 1. Existing HR_ADMIN users are automatically converted to ORG_ADMIN
-- 2. Invitations expire after the time set in expires_at (default 7 days)
-- 3. Run mark_expired_invitations() periodically to clean up
-- 4. ORG_ADMIN has full control over invitations
-- 5. DEPARTMENT_ADMIN can only invite EMPLOYEE users
-- 6. Public can validate tokens via anon policy (for invite acceptance)
