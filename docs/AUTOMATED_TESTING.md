# Automated Testing Configuration

Complete guide for automated testing after build for PolicyPal AI.

---

## Overview

PolicyPal AI can automatically run E2E tests after builds in multiple environments:

1. **Local Development** - Run tests after building locally
2. **Vercel Deployments** - Configure build commands to include tests
3. **GitHub Actions CI/CD** - Automated testing on every push/PR

---

## Local Development

### Build with Tests

```bash
# Build and run tests automatically
npm run build:test

# Or manually
npm run build
npm run test:e2e
```

### PostBuild Hook

Configured in `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "build:test": "npm run build && npm run test:e2e",
    "postbuild": "echo '\n✅ Build complete! Run tests with: npm run test:e2e\n'"
  }
}
```

The `postbuild` script reminds you to run tests after each build.

---

## Vercel Configuration

### Option 1: vercel.json (Recommended)

File: `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm ci && npx playwright install --with-deps chromium",
  "devCommand": "npm run dev",
  "framework": "nextjs"
}
```

**Pros:**
- ✅ Works with Vercel deployment
- ✅ Installs Playwright automatically
- ✅ Simple configuration

**Cons:**
- ⚠️ Tests run on Vercel's build servers (may need Preview URL)
- ⚠️ Requires test environment variables in Vercel

### Option 2: GitHub Actions (Better)

Use GitHub Actions to run tests BEFORE deploying to Vercel.

**Pros:**
- ✅ Tests run in CI before deployment
- ✅ Failed tests block deployment
- ✅ Full control over test environment
- ✅ Can use test database
- ✅ Video artifacts saved

**Workflow:**
1. Push code → GitHub Actions
2. Build app → Run tests
3. If tests pass → Deploy to Vercel
4. If tests fail → Block deployment

---

## GitHub Actions CI/CD

### Configuration

File: `.github/workflows/ci-cd.yml` (already created)

### Key Features

**Build and Test Job:**
- ✅ Runs on every push and PR
- ✅ Matrix testing (Node 18.x, 20.x)
- ✅ Linting before build
- ✅ Full E2E test suite
- ✅ Uploads test results and videos
- ✅ Reports available for 30 days

**Deploy Job:**
- ✅ Only runs on main branch
- ✅ Only after tests pass
- ✅ Deploys to Vercel production

**Scheduled Tests:**
- ✅ Optional nightly test runs
- ✅ Records all videos
- ✅ Monitors production health

### Required GitHub Secrets

Add these in GitHub repo settings → Secrets and variables → Actions:

**Supabase Secrets:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

**AI Secrets:**
```
GEMINI_API_KEY
```

**App Secrets:**
```
NEXT_PUBLIC_APP_URL
```

**Test User Secrets:**
```
TEST_ADMIN_EMAIL
TEST_ADMIN_PASSWORD
TEST_ADMIN_ID
TEST_EMPLOYEE_EMAIL
TEST_EMPLOYEE_PASSWORD
TEST_EMPLOYEE_ID
```

**Vercel Secrets (for deployment):**
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### Usage

```bash
# Push to trigger workflow
git push origin main

# Create PR to trigger tests
git push origin feature-branch
# Then create PR in GitHub

# View results in Actions tab
https://github.com/your-org/policyai/actions
```

---

## Comparison: Local vs Vercel vs GitHub Actions

| Feature | Local | Vercel | GitHub Actions |
|---------|-------|--------|----------------|
| **Control** | Full | Limited | Full |
| **Speed** | Fast | Slow | Medium |
| **Cost** | Free | Free (limits) | Free (limits) |
| **Test DB** | Easy | Complex | Easy |
| **Videos** | Local | Artifacts? | Artifacts ✅ |
| **Block Deploy** | Manual | ❌ | ✅ |
| **Reports** | Local | ❌ | ✅ Saved |
| **Best For** | Dev | Simple deploys | Production |

**Recommendation:** Use **GitHub Actions** for automated testing in CI/CD pipeline.

---

## Best Practices

### ✅ Do

1. **Run tests in CI** - GitHub Actions before deployment
2. **Use test database** - Separate from production
3. **Keep secrets secure** - GitHub Secrets, not committed
4. **Block failed deploys** - Don't deploy broken code
5. **Save test artifacts** - Videos and reports for debugging
6. **Test critical paths** - Auth, chat, document upload

### ❌ Don't

1. **Don't run tests on Vercel** - Slow and complex
2. **Don't use production DB** - Risk of data corruption
3. **Don't commit .env.test** - Security risk
4. **Don't skip tests** - Always test before deploying
5. **Don't ignore failures** - Fix broken tests immediately

---

## Troubleshooting

### Tests Fail in CI but Pass Locally

**Causes:**
- Different Node versions
- Missing environment variables
- Network timing issues
- Database state differences

**Solutions:**
```bash
# Match Node version
nvm use 20

# Check env vars
echo $TEST_ADMIN_EMAIL

# Increase timeouts in CI
test.setTimeout(90000)

# Reset test database
npm run db:reset:test
```

### Vercel Build Times Out

**Causes:**
- Tests take too long
- Too many tests running
- Network issues

**Solutions:**
- Use GitHub Actions instead
- Run subset of critical tests
- Increase Vercel timeout (paid plan)

### Videos Not Uploading

**Check:**
```yaml
- name: Upload videos
  if: always()  # ← Make sure this is present
  uses: actions/upload-artifact@v3
```

---

## Examples

### Run Tests Before Commit (Git Hook)

`.git/hooks/pre-push`:
```bash
#!/bin/bash
echo "Running tests before push..."
npm run test:e2e

if [ $? -ne 0 ]; then
  echo "❌ Tests failed! Fix tests before pushing."
  exit 1
fi

echo "✅ Tests passed!"
```

### Local Build + Test Script

`scripts/build-and-test.sh`:
```bash
#!/bin/bash

echo "🔨 Building app..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "🧪 Running tests..."
npm run test:e2e

if [ $? -ne 0 ]; then
  echo "❌ Tests failed!"
  exit 1
fi

echo "✅ Build and tests passed!"
```

Usage:
```bash
chmod +x scripts/build-and-test.sh
./scripts/build-and-test.sh
```

---

## Summary

**Recommended Setup:**

1. **Local:** Use `npm run build:test` for quick validation
2. **CI/CD:** Use GitHub Actions for automated testing
3. **Deployment:** Deploy to Vercel only after tests pass
4. **Monitoring:** Scheduled nightly tests for regression detection

**Configuration Files:**
- ✅ `package.json` - Build scripts
- ✅ `vercel.json` - Vercel config (optional)
- ✅ `.github/workflows/ci-cd.yml` - CI/CD pipeline
- ✅ `playwright.config.ts` - Test configuration

---

## Related Documentation

- [Testing Guide](TESTING.md)
- [Deployment Checklist](../DEPLOYMENT_CHECKLIST.md)
- [Playwright Best Practices](../PLAYWRIGHT_BEST_PRACTICES.md)

---

**Last Updated:** 2026-07-12
