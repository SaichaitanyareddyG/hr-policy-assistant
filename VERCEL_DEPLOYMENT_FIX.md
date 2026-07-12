# Fix Vercel Deployment - Wait for CI/CD Checks

## Problem

Vercel is deploying immediately when code is pushed to GitHub, **bypassing** the CI/CD quality checks (lint, build, tests). This means broken code can reach production.

## Current Flow (BROKEN ❌)

```
Push to GitHub
    ↓
    ├─ Vercel Git Integration → Deploys in 30s ❌ (ignores CI/CD)
    └─ GitHub Actions
           ├─ Lint (2 min)
           ├─ Build (3 min)
           ├─ Tests (5 min)
           └─ Deploy (would run after checks)
```

**Result:** Production gets deployed BEFORE tests run!

## Desired Flow (CORRECT ✅)

```
Push to GitHub
    ↓
GitHub Actions
    ├─ Lint (2 min) ──┐
    ├─ Build (3 min) ─┤
    └─ Tests (5 min) ─┤
                      ↓
              ALL MUST PASS ✓
                      ↓
              Deploy to Vercel ✅
```

**Result:** Production only gets code that passed all checks!

---

## Solution: Disable Vercel's Automatic Deployments

### Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Select your project: **hr-policy-assistant** (or your project name)

### Step 2: Disable Git Integration Auto-Deploy

1. Click **Settings** (in project navigation)
2. Click **Git** (in left sidebar)
3. Scroll to **"Deploy Hooks"** or **"Production Branch"** section
4. Find **"Ignored Build Step"** setting
5. Set it to: **Ignore all builds**

**OR** (Recommended approach):

1. In **Git** settings
2. Find **"Production Branch"** section
3. Change from `main` to `none` or leave it but...
4. Add a custom **Ignored Build Step** command

### Step 3: Configure Ignored Build Step

In Vercel Settings → Git → **Ignored Build Step**, enter this command:

```bash
# Ignore automatic deployments - only deploy via GitHub Actions
exit 0
```

Or if you want Vercel to ignore ALL automatic builds:

1. Go to: **Settings** → **Git**
2. Scroll to **"Ignored Build Step"**
3. Click **Edit**
4. Select **"Don't build anything"**
5. Click **Save**

### Alternative Method: Use .vercelignore

Add this to `.vercelignore` in your project root:

```
# Disable automatic Vercel deployments
# Only deploy via GitHub Actions CI/CD
*
```

---

## Step 4: Verify GitHub Actions Deployment Still Works

Your `.github/workflows/ci-cd.yml` is already configured correctly:

```yaml
deploy:
  name: Deploy to Production
  needs: [lint, build, test-e2e]  # ✅ Waits for ALL jobs
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  
  steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Vercel Production
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
```

This will **only** deploy after:
- ✅ Lint passes
- ✅ Build succeeds
- ✅ E2E tests pass (Node 18 + 20)

---

## Step 5: Test the Fix

1. Make a small change (e.g., update a comment)
2. Commit and push to `main`:
   ```bash
   git add .
   git commit -m "test: verify deployment waits for CI/CD"
   git push origin main
   ```

3. Watch GitHub Actions: https://github.com/YOUR_USERNAME/hr-policy-assistant/actions

4. Verify the sequence:
   ```
   ⏳ Lint running...
   ⏳ Build running...
   ⏳ Test-e2e (Node 18) running...
   ⏳ Test-e2e (Node 20) running...
   
   --- WAIT FOR ALL TO COMPLETE ---
   
   ✅ Lint passed
   ✅ Build passed
   ✅ Test-e2e (Node 18) passed
   ✅ Test-e2e (Node 20) passed
   
   🚀 Deploy starting...
   ✅ Deploy succeeded
   ```

5. Check Vercel dashboard:
   - Should show deployment from "GitHub Actions"
   - NOT from "Git Push"

---

## Expected Behavior After Fix

### On Push to `main`:
- ✅ GitHub Actions runs all checks (5-7 minutes)
- ✅ If all pass → Deploy to Vercel
- ❌ If any fail → NO deployment (production is safe!)

### On Push to other branches:
- ✅ GitHub Actions runs checks only
- ❌ NO deployment (only main deploys)

### On Pull Request:
- ✅ GitHub Actions runs all checks
- ❌ NO deployment (PRs don't deploy)

---

## Troubleshooting

### Issue: Vercel Still Deploying Automatically

**Cause:** Vercel's Git integration is still enabled

**Fix:**
1. Vercel Dashboard → Settings → Git
2. Completely disconnect the Git integration
3. Or set ignored build step to always return 0

### Issue: GitHub Actions Deploy Fails

**Cause:** Missing Vercel secrets

**Check:**
```bash
# Verify secrets exist:
gh secret list

# Should see:
# VERCEL_TOKEN
# VERCEL_ORG_ID
# VERCEL_PROJECT_ID
```

**Fix:** Re-run setup script:
```bash
./scripts/setup-github-secrets.sh
```

### Issue: Deploy Job Doesn't Run

**Cause:** Not pushing to `main` branch

**Check:**
```yaml
if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

Only triggers on direct pushes to `main` (not PRs, not other branches)

---

## Quick Reference: Vercel Settings

### Recommended Configuration

**Git Integration:**
- Production Branch: `main`
- Ignored Build Step: `exit 0` (or select "Don't build anything")
- Auto-deploy: **Disabled** ❌

**Build & Development:**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**Environment Variables:**
- Same as GitHub secrets
- Should be synced manually

---

## Benefits of This Approach

### Quality Assurance
- ✅ No broken code in production
- ✅ All tests must pass before deploy
- ✅ Lint errors block deployment

### Traceability
- ✅ See which commit passed all checks
- ✅ GitHub Actions shows full CI/CD history
- ✅ Easy to debug failed deployments

### Cost Efficiency
- ✅ Fewer wasted Vercel build minutes
- ✅ Only deploy verified code
- ✅ Cancel in-progress builds automatically

### Developer Experience
- ✅ Clear feedback in GitHub PR checks
- ✅ Blocked deployments show why they failed
- ✅ Confidence in production stability

---

## Summary

**Before Fix:**
```
Push → Vercel deploys immediately (30s) → Tests run later (5 min)
❌ Production gets untested code!
```

**After Fix:**
```
Push → Tests run (5 min) → All pass ✓ → Vercel deploys (1 min)
✅ Production only gets tested code!
```

---

## Next Steps

1. ⚡ **Now:** Disable Vercel auto-deploy (follow Step 2 above)
2. 🧪 **Test:** Push a commit and verify deployment waits
3. 📊 **Monitor:** Check GitHub Actions for successful runs
4. 🎉 **Done:** Enjoy safe, gated deployments!

---

**Documentation Status:** ✅ Complete  
**Priority:** 🔴 Critical (Fix immediately to prevent broken deployments)  
**Estimated Time:** 5 minutes to configure
