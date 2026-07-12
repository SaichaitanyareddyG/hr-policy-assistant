# PolicyPal AI 🤖

**Secure Internal Company Policy Assistant** - Ask questions, get instant answers from your company's policy documents using AI.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🎯 Problem Solved

Employees spend hours searching through:
- 📄 Long PDF policy documents
- 📧 Email threads with HR
- 💬 Slack messages for policy questions
- 📚 Outdated wiki pages

**PolicyPal AI solves this** by providing:
- ✨ Instant AI-powered answers to policy questions
- 🔒 Secure, role-based document access
- 🎯 Audience-targeted content (department, location, employment type)
- 📊 HR-approved FAQs for common questions
- 🔍 Full audit logging for compliance

---

## ✨ Features

### For Employees
- 💬 **Chat Interface** - Ask questions in natural language
- ⚡ **Instant Answers** - FAQ-first, then AI retrieval
- 🧠 **Context-Aware Responses** - Remembers conversation history (NEW)
- 📚 **Source Citations** - See which documents answered your question
- 🔒 **Secure Access** - Only see documents you're authorized for
- 🛡️ **Smart Guardrails** - Only HR policy questions allowed (NEW)

### For HR Admins
- 📤 **Upload Policy Documents** - Drag-and-drop PDFs
- 🎯 **Audience Targeting** - Restrict by department, location, or employment type
- ❓ **Manage FAQs** - Create HR-approved answers for common questions
- 👥 **User Management** - Invite-based onboarding, role assignment
- 📊 **Analytics** - Track questions, document usage, user engagement
- 🛡️ **Security Dashboard** - Monitor access, view audit logs
- 📝 **Audit Logs** - Track all actions (uploads, invites, questions)
- 🔍 **Topic Analytics** - See what topics employees ask about (NEW)

### Security Features
- 🔐 **Private Storage** - All PDFs in private bucket, signed URLs only
- 🔑 **Row Level Security (RLS)** - Organization-level data isolation
- 👤 **Invite-Only Onboarding** - No self-service role assignment
- 🎫 **Role-Based Access** - ORG_ADMIN, DEPARTMENT_ADMIN, EMPLOYEE
- 🚫 **Content Filtering** - AI sees only audience-allowed chunks
- ⏱️ **Rate Limiting** - 20 questions/hour, 30 signed URLs/hour
- 📋 **Audit Logging** - Track all security-relevant actions

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.9** - Type safety
- **Tailwind CSS 3.4** - Styling
- **shadcn/ui** - UI components
- **Lucide Icons** - Icon library

### Backend
- **Supabase** - Authentication, PostgreSQL database, Storage
- **PostgreSQL** - Relational database with pgvector
- **pgvector** - Vector embeddings for semantic search
- **Row Level Security (RLS)** - Database-level authorization

### AI & Embeddings
- **Google Gemini 1.5 Flash** - Chat completions & topic classification
- **text-embedding-004** - 768-dim embeddings
- **RAG (Retrieval Augmented Generation)** - Context-aware answers
- **Conversation Memory** - Multi-turn context (last 5 turns) (NEW)
- **Topic Guardrails** - Prevents off-topic questions (NEW)

---

## 📊 Architecture

```
User Interface (Next.js 15)
     ↓
Server Components + API
     ↓
Business Logic (Auth, RAG, Chat)
     ↓
Supabase (PostgreSQL + pgvector + Storage)
     ↓
Google Gemini (LLM + Embeddings)
```

**📖 [View Complete Architecture →](docs/ARCHITECTURE.md)**

Includes:
- Detailed system diagrams (Mermaid + ASCII)
- Data flow visualization
- Component breakdown
- Security architecture
- Scalability considerations

---

## 🔒 Security

**Multi-layered security:**
- ✅ Invite-only onboarding (no self-registration)
- ✅ Row Level Security (RLS) on all tables
- ✅ Private storage with signed URLs (10-min expiry)
- ✅ Role-based access control (RBAC)
- ✅ Audit logging for all actions
- ✅ Rate limiting (20 questions/hour)
- ✅ No full PDFs sent to LLM (only chunks)

**📖 [View Security Details →](SECURITY_CHECKLIST.md)**

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** installed
- **Supabase account** (free tier works)
- **Google Gemini API key** ([get here](https://aistudio.google.com/app/apikey))

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd PolicyAi
npm install
```

### 2. Set Up Supabase

#### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose a name, region, and database password
4. Wait 2-3 minutes for setup

#### Run Migrations
1. Go to **SQL Editor** in Supabase dashboard
2. Create new query
3. Copy contents from [`supabase/migrations/`](supabase/migrations/) folder
4. Start with `supabase-migration.sql` (base schema)
5. Run migrations in order: step2, step3, step4, step5, step6, step8
6. Run fix migrations: `fix-recursion.sql`, `audit-logs.sql`, `onboarding.sql`

#### Create Storage Bucket
1. Go to **Storage** in Supabase dashboard
2. Click "New Bucket"
3. Name: `policy-documents`
4. **IMPORTANT**: Set to PRIVATE (not public)
5.Node.js 18+
- Supabase account ([free tier](https://supabase.com))
- Google Gemini API key ([get here](https://aistudio.google.com/app/apikey))

### Installation

```bash
# 1. Clone and install
git clone <your-repo-url>
cd PolicyAi
npm install

# 2. Set up environment
cp .env.example .env.local
# Add your Supabase and Gemini credentials

# 3. Run database migrations
# In Supabase SQL Editor: run migrations from supabase/migrations/

# 4. Create storage bucket
# In Supabase Storage: create 'policy-documents' bucket (PRIVATE)

# 5. Start development server
npm run dev
```

Visit **http://localhost:3000**

**📖 [Full Setup Guide →](SETUP_GUIDE.md)le
- Scoped to specific department (HR, FINANCE, IT, OPS, LEGAL)

### EMPLOYEE
- Invited by ORG_ADMIN or DEPARTMENT_ADMIN
- Chat interface only
- Filtered document access
- No admin features

---

## 🎭 Demo Mode

See [`docs/DEMO_SETUP.md`](docs/DEMO_SETUP.md) for full instructions.

### Quick Demo Credentials

```
Demo Admin:
  Email: demo-admin@democorp.com
  Password: Demo123!@#

Demo Employee:
  Email: demo-employee@democorp.com
  Password: Demo123!@#
```

---

## 🛠️ Development

### Project Structure

```
Poli� User Roles

- **ORG_ADMIN** - Full organizational control
- **DEPARTMENT_ADMIN** - Limited admin for specific department
- **EMPLOYEE** - Chat interface with filtered document access

**📖 [View Role Details →](docs/ARCHITECTURE.md#authorization-model)**
# Code Quality
npm run lint             # Run ESLint
npx tsc --noEmit         # TypeScript type checking

# Database
# Run migrations in Supabase SQL Editor
```

---

## 🚀 Deployment

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for comprehensive pre-deployment checks.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm🧪 Testing

**81+ comprehensive E2E tests with Playwright:**

```bash
# Run all tests
npm run test:e2e

# Run specific tests
npm run test:auth        # Authentication (5 tests)
npm run test:admin       # Admin dashboard (10 tests)
npm run test:employee    # Employee portal (5 tests)

# View test report
npm run test:report

# Generate demo videos
npm run test:demo        # Record auth flows
npm run test:demo:all    # Record all features
```

**Features:**
- ✅ Page Object Model architecture
- ✅ data-testid selectors (stable & maintainable)
- ✅ Test fixtures for clean setup
- ✅ Multiple reporters (HTML, JSON, JUnit)
- ✅ Video recording on failure
- ✅ Coverage reports

**📖 [Full Testing Guide →](docs/TESTING.md)**  
**🎬 [Demo Videos Guide →](docs/DEMO_VIDEOS.md)**

---

## 🛠️ Development

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run test:e2e         # Run E2E tests
```

**📖 [Project Structure →](docs/STRUCTURE.md)**  
**📖 [Development Guide →](docs/PHASE2_COMPLETE.md)**x] Audience targeting
- [x] FAQ system
- [x] Audit logging
- [x] Security dashboard

### Phase 2: Enhancements (Coming Soon)
- [ ] Email notifications for invitations
- [ ] Slack/Teams integration
- [ ] Advanced analytics
- [ ] Document versioning
- [ ] Bulk user import
- [ ] API for external integrations

### Phase 3: Enterprise (Future)
- [ ] SAML/SSO authentication
- [ ] Multi-language support
- [ ] Advanced compliance reports
- [ ] Custom branding
- [ ] Dedicated deployment options

---

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
### Deploy to Vercel

```bash
vercel --prod
```

### Automated Testing After Build

Tests run automatically after successful build:

```bash
npm run build:test       # Build + run E2E tests
```

Or configure in `vercel.json`:
```json
{
  "buildCommand": "npm run build && npm run test:e2e",
  "installCommand": "npm ci && npx playwright install --with-deps chromium"
}
```

**📖 [Deployment Checklist →](DEPLOYMENT_CHECKLIST.md)**  
**📖 [CI/CD Setup →](docs/TESTING.md#cicd-integration)**
Built with:
- [Next.js](https://nextjs.org/)
### Core Documentation
- **[Architecture](docs/ARCHITECTURE.md)** - System design, data flow, components
- **[Testing](docs/TESTING.md)** - E2E tests, writing tests, best practices
- **[Demo Videos](docs/DEMO_VIDEOS.md)** - Recording & using demo videos
- **[Security Checklist](SECURITY_CHECKLIST.md)** - Security measures
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Pre-deployment guide

### Implementation Docs
- **[Setup Guide](SETUP_GUIDE.md)** - Detailed installation steps
- **[Project Structure](docs/STRUCTURE.md)** - Code organization
- **[Phase 1 Complete](docs/PHASE1_COMPLETE.md)** - Initial features
- **[Phase 2 Complete](docs/PHASE2_COMPLETE.md)** - Enhancements
- **[Demo Setup](docs/DEMO_SETUP.md)** - Demo mode configuration

### Testing Docs
- **[Playwright Best Practices](docs/PLAYWRIGHT_BEST_PRACTICES.md)** - Detailed patterns
- **[Setup & User Fix Guide](docs/SETUP_AND_USER_FIX.md)** - Setup instructions & user deletion

---

## 🛤️ Roadmap

### ✅ Phase 1 & 2 Complete
- Authentication & RBAC
- Document processing & embeddings
- AI chat with RAG
- Audience targeting
- FAQ system
- Audit logging
- Chat history
- Security dashboard
- E2E testing (81+ tests)

### 🔜 Phase 3: Enterprise
- Email notifications
- Slack/Teams integration
- Advanced analytics
- Document versioning
- SAML/SSO authentication
- Multi-language support

---

## 🙏 Built With

- [Next.js 15](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend platform
- [Google Gemini](https://ai.google.dev/) - LLM & embeddings
- [Playwright](https://playwright.dev/) - E2E testing
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for better HR communication