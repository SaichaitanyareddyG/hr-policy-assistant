#!/bin/bash

# ============================================
# Quick User Deletion Helper
# ============================================
# Generates SQL to delete a user properly from Supabase

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Supabase User Deletion Helper         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if email provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: No email provided${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./delete-user.sh email@example.com"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./delete-user.sh sai29chaitu@gmail.com"
    echo "  ./delete-user.sh test@example.com"
    echo ""
    exit 1
fi

EMAIL=$1

echo -e "${YELLOW}📧 Email to delete:${NC} $EMAIL"
echo ""
echo -e "${RED}⚠️  WARNING: This will permanently delete the user!${NC}"
echo ""
echo -e "${BLUE}What will be deleted:${NC}"
echo "  1. Auth user from auth.users table"
echo "  2. Profile from profiles table (cascade)"
echo "  3. All related data (sessions, messages, etc.)"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}Copy and run this SQL in Supabase SQL Editor:${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo ""

# Generate SQL
cat << EOF
-- Delete user: $EMAIL
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Check if user exists
SELECT 
  'Before deletion' as status,
  id, 
  email, 
  created_at 
FROM auth.users 
WHERE email = '$EMAIL';

-- Step 2: Delete from auth.users (profiles will cascade)
DELETE FROM auth.users WHERE email = '$EMAIL';

-- Step 3: Verify deletion
SELECT 
  'Auth Users' as table_name,
  COUNT(*) as remaining 
FROM auth.users 
WHERE email = '$EMAIL'
UNION ALL
SELECT 
  'Profiles' as table_name,
  COUNT(*) as remaining 
FROM profiles 
WHERE email = '$EMAIL';

-- Both should show 0 remaining

EOF

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Alternative: Use Supabase Dashboard${NC}"
echo "  1. Go to Supabase Dashboard"
echo "  2. Click 'Authentication' in sidebar"
echo "  3. Click 'Users' tab"
echo "  4. Find: $EMAIL"
echo "  5. Click ••• menu → Delete user"
echo ""
echo -e "${GREEN}✅ After deletion, you can register with this email again!${NC}"
echo ""
