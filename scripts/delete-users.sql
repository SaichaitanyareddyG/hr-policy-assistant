-- ============================================
-- User Deletion Script for Development/Testing
-- ============================================
-- Use this to properly delete users from Supabase
-- This deletes from auth.users which cascades to profiles

-- ============================================
-- Option 1: Delete Specific User
-- ============================================

-- Replace with your email
DELETE FROM auth.users WHERE email = 'sai29chaitu@gmail.com';

-- Verify deletion
SELECT 'Auth Users Check:' as check_type, COUNT(*) as count 
FROM auth.users WHERE email = 'sai29chaitu@gmail.com'
UNION ALL
SELECT 'Profiles Check:', COUNT(*) 
FROM profiles WHERE email = 'sai29chaitu@gmail.com';

-- Should show 0 for both


-- ============================================
-- Option 2: Delete Multiple Specific Users
-- ============================================

DELETE FROM auth.users 
WHERE email IN (
  'sai29chaitu@gmail.com',
  'test@example.com',
  'another@example.com'
);


-- ============================================
-- Option 3: Delete All Test Users
-- ============================================
-- ⚠️ WARNING: This deletes ALL users with test/gmail emails
-- Only use in development environment!

DELETE FROM auth.users 
WHERE email LIKE '%@gmail.com' 
   OR email LIKE '%@test.com'
   OR email LIKE '%@policyai.test'
   OR email LIKE '%demo%@%';


-- ============================================
-- Option 4: Delete All Users (Nuclear Option)
-- ============================================
-- ⚠️⚠️⚠️ EXTREME CAUTION! This deletes EVERYTHING!
-- Only use when resetting development database

-- Uncomment to use (safety measure)
-- DELETE FROM auth.users;


-- ============================================
-- Option 5: Keep Only Specific Users
-- ============================================
-- Delete all EXCEPT these users (safe for production)

DELETE FROM auth.users 
WHERE email NOT IN (
  'admin@yourcompany.com',
  'hr@yourcompany.com'
);


-- ============================================
-- Verification Queries
-- ============================================

-- List all auth users
SELECT 
  id, 
  email, 
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- List all profiles
SELECT 
  id,
  email,
  full_name,
  role,
  org_id,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- Count users by table
SELECT 
  'auth.users' as table_name,
  COUNT(*) as total_users
FROM auth.users
UNION ALL
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_users
FROM profiles;

-- Find orphaned records (should be 0 if cascade is working)
-- Profiles without auth users
SELECT 
  p.id,
  p.email,
  'Profile exists but no auth user' as issue
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- Auth users without profiles (might be intentional during registration)
SELECT 
  au.id,
  au.email,
  'Auth user exists but no profile' as issue
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;


-- ============================================
-- Explanation
-- ============================================

/*
WHY DELETE FROM auth.users (NOT profiles)?

Database Schema:
  auth.users (Supabase Auth table)
      ↓
  profiles (Your app table)
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE

CASCADE DELETE means:
  ✅ Delete auth.users → profiles auto-deleted
  ❌ Delete profiles → auth.users remains (PROBLEM!)

CORRECT ORDER:
  1. Delete from auth.users
  2. Cascade automatically deletes profiles
  3. All related data cleaned up

WRONG ORDER:
  1. Delete from profiles
  2. Auth user still exists
  3. Can't register with same email again
  4. Get "email already exists" error

SOLUTION:
  Always delete from auth.users, never directly from profiles!
*/


-- ============================================
-- Quick Fix for "Email Already Exists" Error
-- ============================================

-- If you get "email already exists" error:
-- 1. Find the user
SELECT id, email, created_at FROM auth.users WHERE email = 'your-email@example.com';

-- 2. Delete from auth.users (profiles will cascade delete)
DELETE FROM auth.users WHERE email = 'your-email@example.com';

-- 3. Verify both are gone
SELECT COUNT(*) FROM auth.users WHERE email = 'your-email@example.com';   -- Should be 0
SELECT COUNT(*) FROM profiles WHERE email = 'your-email@example.com';     -- Should be 0

-- 4. Now you can register again!


-- ============================================
-- Reset Test Environment (Development Only)
-- ============================================

-- Full reset for testing:
BEGIN;

-- 1. Delete all test users
DELETE FROM auth.users 
WHERE email LIKE '%@test.com' 
   OR email LIKE '%@policyai.test'
   OR email LIKE '%@gmail.com';

-- 2. Verify counts
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM profiles) as profiles;

-- 3. If looks good, commit. Otherwise rollback.
COMMIT;
-- Or: ROLLBACK;
