# Deployment Checklist - PolicyPal AI

Complete this checklist before deploying to production.

## 📋 Pre-Deployment

### Environment Setup
- [ ] `.env.local` configured for production
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set correctly
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set correctly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set correctly (server-side only)
- [ ] `GEMINI_API_KEY` set correctly
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] Demo mode disabled (`NEXT_PUBLIC_DEMO_MODE=false`)

### Database Migrations
- [ ] Applied `supabase-migration-onboarding.sql`
- [ ] Applied `supabase-migration-audit-logs.sql`
- [ ] Verified all tables exist
- [ ] Verified RLS is enabled on all tables
- [ ] Tested RLS policies

### Supabase Storage
- [ ] Created `policy-documents` bucket
- [ ] Set bucket to PRIVATE (not public)
- [ ] Verified public URLs don't work
- [ ] Tested signed URL generation
- [ ] Tested signed URL expiry

### Code Quality
- [ ] Run `npm run build` successfully
- [ ] Run `npx tsc --noEmit` - zero TypeScript errors
- [ ] Run `npm run lint` - zero linting errors
- [ ] All tests passing (if tests exist)
- [ ] No console.logs with sensitive data
- [ ] No hardcoded secrets

## ✅ Authentication Testing

### Organization Registration
- [ ] Can register new organization
- [ ] Registration creates ORG_ADMIN only
- [ ] No role dropdown visible
- [ ] Auto sign-in works
- [ ] Redirect to /admin works

### User Invitations
- [ ] ORG_ADMIN can invite all roles
- [ ] DEPARTMENT_ADMIN can only invite EMPLOYEE
- [ ] EMPLOYEE cannot invite anyone
- [ ] Invitation tokens generate correctly
- [ ] Invitation links work
- [ ] Token expiry works (7 days)
- [ ] Can revoke pending invitations
- [ ] Can resend expired invitations

### Invitation Acceptance
- [ ] Valid token shows invitation details
- [ ] Expired token rejected
- [ ] Revoked token rejected
- [ ] Accepted token cannot be reused
- [ ] Account created correctly
- [ ] Role assigned from invitation
- [ ] Auto sign-in works
- [ ] Role-based redirect works

## ✅ Authorization Testing

### Route Protection
- [ ] `/admin` blocked for EMPLOYEE
- [ ] `/employee` blocked for admins
- [ ] `/admin/security` blocked for DEPARTMENT_ADMIN
- [ ] `/admin/users` works for ORG_ADMIN
- [ ] Unauthenticated users redirected to login

### Role Permissions
- [ ] ORG_ADMIN has full access
- [ ] DEPARTMENT_ADMIN has limited access
- [ ] EMPLOYEE has basic access
- [ ] Cross-org access impossible

## ✅ Document Security Testing

### Upload Security
- [ ] Only admins can upload
- [ ] PDF validation works
- [ ] File size limit enforced (10MB)
- [ ] Files stored in private bucket
- [ ] File names sanitized

### Access Control
- [ ] Signed URLs require authentication
- [ ] Signed URLs expire (10 min)
- [ ] Permission checks work
- [ ] Public URLs don't work
- [ ] Audience filtering works

### Audience Targeting
- [ ] ALL documents visible to all employees
- [ ] RESTRICTED documents filtered correctly
- [ ] Department filtering works
- [ ] Location filtering works
- [ ] Employment type filtering works
- [ ] Admins bypass audience restrictions

## ✅ AI & Chat Testing

### FAQ System
- [ ] Can create FAQs
- [ ] FAQs checked before RAG
- [ ] FAQ answers show "HR-approved" badge
- [ ] FAQ audience targeting works
- [ ] Can archive FAQs

### RAG Retrieval
- [ ] Chunk retrieval works
- [ ] Audience filtering applied
- [ ] Max 5 chunks returned
- [ ] Chunks trimmed to 2000 chars
- [ ] No full PDFs sent to LLM

### Chat Flow
- [ ] Questions sanitized
- [ ] Rate limiting works (20/hour)
- [ ] Answers generated correctly
- [ ] Sources shown
- [ ] Confidence levels work
- [ ] Chat history saved

## ✅ Audit Logging Testing

### Event Tracking
- [ ] Organization creation logged
- [ ] User invitation logged
- [ ] Invite acceptance logged
- [ ] Document upload logged
- [ ] Audience change logged
- [ ] Signed URL generation logged
- [ ] Employee question logged
- [ ] AI answer logged
- [ ] FAQ answer logged

### Access Control
- [ ] ORG_ADMIN sees all logs
- [ ] DEPARTMENT_ADMIN sees limited logs
- [ ] EMPLOYEE cannot see logs
- [ ] Logs are immutable

## ✅ Security Dashboard Testing

### Status Cards
- [ ] All features show "Enabled"
- [ ] Security status accurate
- [ ] Document stats correct
- [ ] Recent events displayed

### Access Control
- [ ] Only ORG_ADMIN can access
- [ ] DEPARTMENT_ADMIN blocked
- [ ] EMPLOYEE blocked

## ✅ Performance Testing

### Page Load
- [ ] Landing page < 2s
- [ ] Admin dashboard < 3s
- [ ] Employee chat < 2s
- [ ] Document list < 3s

### API Response
- [ ] Chat API < 5s
- [ ] Document retrieval < 1s
- [ ] FAQ search < 500ms
- [ ] Signed URL generation < 1s

### Database
- [ ] Queries optimized
- [ ] Indexes created
- [ ] No N+1 queries
- [ ] Connection pooling works

## ✅ Security Verification

### Storage
- [ ] Bucket is private
- [ ] Public URLs blocked
- [ ] Signed URLs only
- [ ] Expiry enforced

### Authentication
- [ ] No self-service roles
- [ ] Invite-only onboarding
- [ ] Tokens secure
- [ ] Expiry works

### Authorization
- [ ] RLS enabled
- [ ] Org isolation works
- [ ] Role checks work
- [ ] Permission helpers used

### API Security
- [ ] All routes authenticated
- [ ] Input validated
- [ ] Output sanitized
- [ ] Rate limiting active

## ✅ Production Deployment

### Hosting
- [ ] Deploy to Vercel/Netlify/etc
- [ ] Environment variables set
- [ ] Build successful
- [ ] Preview deployment tested

### Domain
- [ ] Custom domain configured
- [ ] HTTPS enabled
- [ ] SSL certificate valid
- [ ] Redirects configured

### Monitoring
- [ ] Error tracking enabled (Sentry/etc)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alerts configured

## ✅ Post-Deployment

### Smoke Tests
- [ ] Landing page loads
- [ ] Registration works
- [ ] Login works
- [ ] Admin dashboard loads
- [ ] Employee chat works
- [ ] Document upload works

### Security Checks
- [ ] HTTPS enforced
- [ ] Service role key not exposed
- [ ] API keys not exposed
- [ ] RLS working
- [ ] Rate limiting working

### Documentation
- [ ] README updated
- [ ] SECURITY_CHECKLIST reviewed
- [ ] DEMO_SETUP instructions ready
- [ ] User guide available

## ✅ User Acceptance

### Create Test Organization
- [ ] Register first org
- [ ] Invite test users
- [ ] Upload sample documents
- [ ] Create test FAQs
- [ ] Test employee chat

### Verify Core Workflows
- [ ] Admin can manage users
- [ ] Admin can upload docs
- [ ] Admin can create FAQs
- [ ] Employees can ask questions
- [ ] Employees get correct answers
- [ ] Audit logs work

## ✅ Handoff

### Access & Credentials
- [ ] Production credentials documented
- [ ] Supabase project access shared
- [ ] API keys documented securely
- [ ] Admin accounts created

### Documentation
- [ ] README complete
- [ ] Security docs complete
- [ ] Architecture documented
- [ ] Deployment guide complete

### Support
- [ ] Bug reporting process defined
- [ ] Feature request process defined
- [ ] Security contact defined
- [ ] Monitoring alerts configured

## 📊 Final Checklist Summary

**Total Items**: ~140  
**Must Pass**: 100%  

**Status**: ⬜ Ready | ⬜ Not Ready

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Sign-Off**: _______________

---

## 🚀 Deploy Command

Once all checks pass:

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to your hosting platform
```

## 📞 Support

For deployment issues:
- Technical Lead: [name@email.com]
- DevOps: [name@email.com]
- Security: [security@email.com]

**🎉 Ready to deploy!**
