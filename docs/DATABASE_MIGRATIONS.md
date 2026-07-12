# Database Migration Guide

## 🎯 Overview

This project uses **Supabase CLI** for database migrations following production best practices:
- ✅ Automatic version control with timestamps
- ✅ Rollback capability  
- ✅ Multi-environment support (dev/staging/prod)
- ✅ CI/CD integration ready
- ✅ Schema diffing and tracking

---

## 📋 Prerequisites

### 1. Install Supabase CLI (Already Done!)

```bash
npm install -D supabase
```

### 2. Login to Supabase (One-time setup)

```bash
npm run db:login
```

This will open a browser for authentication.

### 3. Link to Your Project (One-time setup)

```bash
npm run db:link
```

This connects your local environment to your remote Supabase project (`grjityzozhqdowsgawyf`).

---

## 🚀 Common Commands

### Check Migration Status

```bash
npm run db:status
```

Shows:
- ✅ Applied migrations (with timestamps)
- ⏳ Pending migrations (not yet applied)

### Create New Migration

```bash
npm run db:new "add_user_column"
```

Creates: `supabase/migrations/YYYYMMDDHHMMSS_add_user_column.sql`

### Apply Migrations to Remote

```bash
npm run db:push
```

Applies all pending migrations to your remote Supabase database.

### Pull Remote Schema Changes

```bash
npm run db:pull
```

Creates a new migration file with changes made directly in Supabase Dashboard.

### View Schema Differences

```bash
npm run db:diff
```

Shows differences between local and remote database schemas.

### Reset Local Database (Development Only!)

```bash
npm run db:reset
```

⚠️ **WARNING**: This drops ALL data and replays ALL migrations from scratch. Only use in development!

---

## 📁 Migration File Structure

```
supabase/
├── config.toml                                          # Supabase CLI config
├── migrations/
│   ├── 20240528120000_initial_setup.sql
│   ├── 20240528121700_add_clarifications.sql
│   ├── 20240528122000_add_chunks_and_embeddings.sql
│   ├── 20240528124800_add_faq_system.sql
│   ├── 20240528124900_add_chat_system.sql
│   ├── 20240528125600_add_notifications.sql
│   ├── 20240528132500_add_onboarding.sql
│   ├── 20240528133300_add_audit_logs.sql
│   ├── 20240528133400_add_security_enhancements.sql
│   ├── 20240530141900_fix_database_issues.sql
│   ├── 20240530144600_fix_recursion.sql
│   └── 20260712105700_add_storage_policies.sql
└── .gitignore
```

**File Naming Convention:**
- Format: `YYYYMMDDHHMMSS_description.sql`
- Example: `20240528120000_initial_setup.sql`
- Timestamp ensures proper ordering

---

## 🔄 Typical Workflow

### Development (Adding New Feature)

1. **Create Migration**
   ```bash
   npm run db:new "add_department_column"
   ```

2. **Write SQL**
   Edit: `supabase/migrations/YYYYMMDDHHMMSS_add_department_column.sql`
   ```sql
   ALTER TABLE profiles ADD COLUMN department TEXT;
   ```

3. **Apply Locally** (if using local dev)
   ```bash
   npm run db:reset  # Test in local environment
   ```

4. **Commit Changes**
   ```bash
   git add supabase/migrations/
   git commit -m "feat: Add department column to profiles"
   git push
   ```

5. **Apply to Production**
   ```bash
   npm run db:push
   ```

---

### Making Changes in Supabase Dashboard

If you made changes directly in Supabase Dashboard (not recommended but happens):

1. **Pull Changes**
   ```bash
   npm run db:pull
   ```
   
   This creates a new migration file with the changes.

2. **Review Generated Migration**
   Check: `supabase/migrations/YYYYMMDDHHMMSS_remote_schema.sql`

3. **Commit to Git**
   ```bash
   git add supabase/migrations/
   git commit -m "chore: Sync schema from dashboard"
   ```

---

## 🌍 Multi-Environment Setup

### Development
```bash
npm run db:link  # Links to dev project
npm run db:push
```

### Staging
```bash
supabase link --project-ref <staging-project-ref>
npm run db:push
```

### Production
```bash
supabase link --project-ref <prod-project-ref>
npm run db:push
```

---

## 🤖 CI/CD Integration (GitHub Actions)

Create: `.github/workflows/deploy-migrations.yml`

```yaml
name: Deploy Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Link to Supabase Project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          
      - name: Apply Migrations
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

**Required Secrets:**
- `SUPABASE_PROJECT_REF`: `grjityzozhqdowsgawyf`
- `SUPABASE_ACCESS_TOKEN`: Get from Supabase Dashboard > Settings > API > Access Tokens

---

## 📊 Migration History

All migrations are tracked in order:

| Timestamp | Description | Status |
|-----------|-------------|--------|
| 20240528120000 | Initial setup | ✅ Applied |
| 20240528121700 | Add clarifications | ✅ Applied |
| 20240528122000 | Add chunks and embeddings | ✅ Applied |
| 20240528124800 | Add FAQ system | ✅ Applied |
| 20240528124900 | Add chat system | ✅ Applied |
| 20240528125600 | Add notifications | ✅ Applied |
| 20240528132500 | Add onboarding | ✅ Applied |
| 20240528133300 | Add audit logs | ✅ Applied |
| 20240528133400 | Add security enhancements | ✅ Applied |
| 20240530141900 | Fix database issues | ✅ Applied |
| 20240530144600 | Fix recursion | ✅ Applied |
| 20260712105700 | Add storage policies | ⏳ Pending |

---

## 🔍 Troubleshooting

### Issue: Migration Already Applied

**Error:** `Migration YYYYMMDDHHMMSS_name.sql has already been applied`

**Solution:**
```bash
npm run db:status  # Check which are applied
# Edit migration or create new one
```

### Issue: Migration Conflict

**Error:** `Migration checksum mismatch`

**Solution:**
Migration files should never be edited after being applied. Create a new migration instead:
```bash
npm run db:new "fix_previous_migration"
```

### Issue: Can't Connect to Project

**Error:** `Access token not provided`

**Solution:**
```bash
npm run db:login  # Login again
npm run db:link   # Re-link to project
```

---

## ⚠️ Best Practices

### ✅ DO:
- ✅ Create new migration for every schema change
- ✅ Use descriptive migration names
- ✅ Test migrations in development first
- ✅ Commit migrations to git
- ✅ Use `npm run db:push` for production
- ✅ Review generated SQL before applying

### ❌ DON'T:
- ❌ Edit migrations after they're applied
- ❌ Delete migration files
- ❌ Make schema changes directly in production
- ❌ Skip version control for migrations
- ❌ Forget to test rollback scenarios

---

## 🆘 Emergency Rollback

If a migration causes issues:

1. **Identify the Problem Migration**
   ```bash
   npm run db:status
   ```

2. **Create Rollback Migration**
   ```bash
   npm run db:new "rollback_feature_x"
   ```

3. **Write Reverse SQL**
   ```sql
   -- Reverse the problematic changes
   ALTER TABLE profiles DROP COLUMN department;
   ```

4. **Apply Rollback**
   ```bash
   npm run db:push
   ```

---

## 📚 Additional Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Migration Best Practices](https://supabase.com/docs/guides/cli/managing-environments)
- [Schema Diffing](https://supabase.com/docs/guides/cli/local-development#diffing-changes)

---

## 🎯 Quick Reference

```bash
# Setup (one-time)
npm run db:login              # Authenticate
npm run db:link               # Link to project

# Daily workflow
npm run db:new "description"  # Create migration
npm run db:status             # Check status
npm run db:push               # Apply to remote

# Advanced
npm run db:pull               # Sync from remote
npm run db:diff               # View differences
npm run db:reset              # Reset local DB
```

---

## ✅ Migration Setup Complete!

Your project is now using production-ready migration practices:
- ✅ Supabase CLI installed
- ✅ Project initialized
- ✅ Migrations renamed to timestamped format
- ✅ Scripts added to package.json
- ✅ Ready for CI/CD

**Next Steps:**
1. Run `npm run db:login` (one-time)
2. Run `npm run db:link` (one-time)
3. Run `npm run db:status` to verify
4. Start using `npm run db:new` for new migrations!
