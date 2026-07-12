-- Fix database schema for new role system
-- Run this in Supabase SQL Editor

-- 1. Drop the old role constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Add new role constraint with updated roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN', 'EMPLOYEE'));

-- 3. Update RLS policy for admins (drop old policy)
DROP POLICY IF EXISTS "HR_ADMIN can view all profiles in their organization" ON profiles;

-- 4. Create new admin policy
CREATE POLICY "Admins can view all profiles in their organization"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN')
            AND p.org_id = profiles.org_id
        )
    );

-- 5. Get the demo organization ID
-- You'll need this to create the profile below
SELECT id FROM organizations WHERE name = 'Demo Company Inc.';

-- 6. Create profile for chaitanya@gmail.com
-- Replace <USER_ID> with: 8b909cf1-ac11-4563-ba90-feca01ee7ddd
-- Replace <ORG_ID> with the organization ID from step 5
INSERT INTO profiles (id, org_id, full_name, email, role)
VALUES (
    '8b909cf1-ac11-4563-ba90-feca01ee7ddd',
    (SELECT id FROM organizations WHERE name = 'Demo Company Inc.' LIMIT 1),
    'Chaitanya',
    'chaitanya@gmail.com',
    'ORG_ADMIN'  -- Change to 'EMPLOYEE' or 'DEPARTMENT_ADMIN' if needed
)
ON CONFLICT (id) DO UPDATE
SET role = 'ORG_ADMIN';

-- Verify the profile was created
SELECT * FROM profiles WHERE email = 'chaitanya@gmail.com';
