# 🔧 Setup Instructions & User Deletion Fix

## ✅ What You Need to Do

### 1. GitHub Actions Setup (If Using CI/CD)

Add these secrets to your GitHub repository:

**Go to:** GitHub repo → Settings → Secrets and variables → Actions → New repository secret

**Required Secrets:**

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI
GEMINI_API_KEY=your-gemini-api-key-here

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Test Users (from your .env.test file)
TEST_ADMIN_EMAIL=test.admin@policyai.test
TEST_ADMIN_PASSWORD=TestAdmin123!@#Secure
TEST_ADMIN_ID=8050157d-e8e0-4ab3-a71d-64aaf64b1a3f
TEST_EMPLOYEE_EMAIL=test.employee@policyai.test
TEST_EMPLOYEE_PASSWORD=TestEmployee123!@#Secure
TEST_EMPLOYEE_ID=dce3b201-721a-4bf4-804c-45714247997c

# Vercel (for auto-deployment)
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

**Get Vercel Token:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login and get token
vercel login
# Go to: https://vercel.com/account/tokens
```

### 2. Test Locally First

```bash
# Test build with tests
npm run build:test

# If it works, you're good to push!
git push origin main
```

### 3. Vercel Environment Variables

Add the same environment variables in Vercel dashboard:
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add all production variables

---

## 🐛 User Deletion Fix

### The Problem

You deleted rows from the `profiles` table, but **users still exist in Supabase Auth** (`auth.users` table).

When you try to register with `sai29chaitu@gmail.com`, the code checks:
```typescript
// From lib/auth/registration.ts
const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
const emailExists = existingUser?.users?.some(
  (user) => user.email?.toLowerCase() === input.adminEmail.toLowerCase()
);
```

This checks the **auth.users** table, not the profiles table!

### The Solution

You need to delete the user from **Supabase Auth**, not just the profiles table.

#### Option 1: Supabase Dashboard (Easiest)

1. Go to Supabase dashboard
2. Click **Authentication** in left sidebar
3. Click **Users** tab
4. Find `sai29chaitu@gmail.com`
5. Click the **•••** menu → **Delete user**
6. Confirm deletion

This will delete:
- ✅ The auth user
- ✅ The profile (cascading delete via trigger)

#### Option 2: SQL Query

Run this in Supabase SQL Editor:

```sql
-- Delete user by email from auth.users
-- This will cascade delete the profile due to foreign key
DELETE FROM auth.users 
WHERE email = 'sai29chaitu@gmail.com';
```

#### Option 3: Delete All Test Users (Clean Slate)

If you want to delete ALL test/dev users:

```sql
-- ⚠️ WARNING: This deletes ALL users except production ones
-- Only run this in development/test environment!

-- Delete all profiles first (optional, will cascade anyway)
DELETE FROM profiles 
WHERE email NOT LIKE '%@production.com'; -- Adjust filter as needed

-- Delete all auth users (be careful!)
DELETE FROM auth.users 
WHERE email LIKE '%@gmail.com' 
   OR email LIKE '%@test.com'
   OR email LIKE '%@policyai.test';
```

---

## 🔍 Why This Happens

**Supabase Architecture:**
```
auth.users (Supabase Auth)
    ↓ (triggers create profile)
profiles (Your app data)
```

**When you register:**
1. Create auth user → `auth.users` table
2. Trigger creates → `profiles` table row

**When you delete from profiles:**
- ❌ Auth user still exists
- ✅ Profile deleted
- ❌ Can't register again (email exists in auth)

**Correct deletion order:**
1. Delete from `auth.users` (this cascades to profiles)
2. Or use Supabase dashboard UI

---

## 📝 Quick Fix for Your Case

Run this SQL in Supabase SQL Editor:

```sql
-- Delete your specific user
DELETE FROM auth.users WHERE email = 'sai29chaitu@gmail.com';

-- Verify deletion
SELECT email, created_at FROM auth.users WHERE email = 'sai29chaitu@gmail.com';
-- Should return 0 rows

-- Also verify profile is gone
SELECT email, full_name FROM profiles WHERE email = 'sai29chaitu@gmail.com';
-- Should return 0 rows
```

Now you can register with `sai29chaitu@gmail.com` again!

---

## 🛡️ Prevention: User Management Script

Create a helper script for development:

**File: `scripts/delete-user.sh`**

```bash
#!/bin/bash

EMAIL=$1

if [ -z "$EMAIL" ]; then
  echo "Usage: ./delete-user.sh email@example.com"
  exit 1
fi

echo "🗑️  Deleting user: $EMAIL"
echo "This will delete from auth.users (profiles will cascade)"
echo ""
echo "SQL to run in Supabase:"
echo ""
echo "DELETE FROM auth.users WHERE email = '$EMAIL';"
echo ""
echo "Or use Supabase Dashboard → Authentication → Users → Delete"
```

Usage:
```bash
chmod +x scripts/delete-user.sh
./scripts/delete-user.sh sai29chaitu@gmail.com
```

---

## ✅ Verification Steps

After deleting the user:

1. **Check auth.users:**
   ```sql
   SELECT id, email, created_at 
   FROM auth.users 
   WHERE email = 'sai29chaitu@gmail.com';
   ```
   Should return **0 rows**

2. **Check profiles:**
   ```sql
   SELECT id, email, full_name 
   FROM profiles 
   WHERE email = 'sai29chaitu@gmail.com';
   ```
   Should return **0 rows**

3. **Try registration:**
   - Go to `/register`
   - Try registering with `sai29chaitu@gmail.com`
   - Should work now! ✅

---

## 🎯 Summary

**For GitHub Actions Setup:**
- ✅ Add secrets to GitHub repo settings
- ✅ Test locally first with `npm run build:test`
- ✅ Push to main → tests run automatically

**For User Deletion Issue:**
- ✅ Delete from `auth.users` table (not just profiles)
- ✅ Use Supabase Dashboard → Authentication → Users → Delete
- ✅ Or run SQL: `DELETE FROM auth.users WHERE email = 'sai29chaitu@gmail.com';`
- ✅ Then try registration again

**Files Ready:**
- ✅ All code committed
- ✅ GitHub Actions workflow ready
- ✅ Vercel config ready
- ✅ Just need to add secrets!

---

**Quick Fix Right Now:**

1. Go to Supabase Dashboard
2. Authentication → Users
3. Find and delete `sai29chaitu@gmail.com`
4. Try registration again ✅
