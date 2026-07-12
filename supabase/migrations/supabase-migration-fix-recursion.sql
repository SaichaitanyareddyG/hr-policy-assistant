-- =====================================================
-- FIX: Infinite Recursion in Profiles RLS Policies
-- =====================================================
-- Multiple migrations created policies that query profiles FROM profiles,
-- causing infinite recursion. This fixes ALL of them.
-- =====================================================

-- Step 1: Drop ALL problematic recursive policies on profiles
DROP POLICY IF EXISTS "HR_ADMIN can view all profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "org_admin_read_org_profiles" ON profiles;
DROP POLICY IF EXISTS "org_admin_update_org_profiles" ON profiles;
DROP POLICY IF EXISTS "dept_admin_read_org_profiles" ON profiles;
DROP POLICY IF EXISTS "hr_admin_read_org_profiles" ON profiles;
DROP POLICY IF EXISTS "hr_admin_update_org_profiles" ON profiles;

-- Step 2: Create helper functions that bypass RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_id() TO authenticated;

-- Step 3: Recreate policies WITHOUT recursion

-- Users can always view their own profile
CREATE POLICY "users_read_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "users_update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- ORG_ADMIN can read all profiles in their org (NO RECURSION)
CREATE POLICY "org_admin_read_org_profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  public.get_user_role() = 'ORG_ADMIN'
  AND public.get_user_org_id() = org_id
);

-- ORG_ADMIN can update all profiles in their org (NO RECURSION)
CREATE POLICY "org_admin_update_org_profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  public.get_user_role() = 'ORG_ADMIN'
  AND public.get_user_org_id() = org_id
)
WITH CHECK (
  public.get_user_role() = 'ORG_ADMIN'
  AND public.get_user_org_id() = org_id
);

-- DEPARTMENT_ADMIN can read profiles in their org (NO RECURSION)
CREATE POLICY "dept_admin_read_org_profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  public.get_user_role() = 'DEPARTMENT_ADMIN'
  AND public.get_user_org_id() = org_id
);
