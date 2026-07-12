# Project Structure

This document explains the clean, organized structure of the PolicyAi codebase.

---

## 📁 Root Directory

```
PolicyAi/
├── app/                    # Next.js 15 App Router
├── components/             # React components
├── docs/                   # 📚 All documentation (NEW)
├── hooks/                  # React custom hooks
├── lib/                    # Business logic & utilities
├── supabase/              # Supabase config & migrations
├── types/                  # TypeScript type definitions
├── middleware.ts           # Next.js middleware
└── README.md              # Project overview
```

---

## 📚 Documentation (`docs/`)

All project documentation organized in one place:

```
docs/
├── STRUCTURE.md                      # This file
├── IMPLEMENTATION_PLAN.md            # Feature roadmap
├── PHASE1_COMPLETE.md                # Phase 1 summary
├── PHASE2_COMPLETE.md                # Phase 2 summary
├── PROJECT_STATUS_ANALYSIS.md        # Initial analysis
├── BEST_PRACTICES.md                 # Coding standards
├── SECURITY_CHECKLIST.md             # Security guidelines
├── SESSION_MANAGEMENT.md             # Auth session handling
├── ERROR_HANDLING.md                 # Error patterns
├── ERROR_BOUNDARY_TROUBLESHOOTING.md # Debug guide
├── DEPLOYMENT_CHECKLIST.md           # Deploy steps
├── DEMO_SETUP.md                     # Demo configuration
└── BUILD_ISSUE.md                    # Known build issues
```

---

## 🗄️ Database (`supabase/migrations/`)

All SQL migration files in chronological order:

```
supabase/
└── migrations/
    ├── supabase-migration.sql              # Base schema
    ├── supabase-migration-step2.sql        # Auth enhancements
    ├── supabase-migration-step3.sql        # Document processing
    ├── supabase-migration-step4.sql        # Chat system
    ├── supabase-migration-step5.sql        # FAQ system
    ├── supabase-migration-step6.sql        # Clarifications
    ├── supabase-migration-step8-security.sql # Security policies
    ├── supabase-migration-audit-logs.sql   # Audit logging
    ├── supabase-migration-onboarding.sql   # Onboarding flow
    ├── supabase-migration-fix-recursion.sql # RLS fix
    └── fix-database.sql                    # Database repairs
```

---

## 🛠️ Business Logic (`lib/`)

Clean feature-based organization:

### **Feature Structure:**
Each feature has its own folder with:
- `actions.ts` - Server Actions (mutations)
- `queries.ts` - Data fetching (reads)
- `types.ts` - Feature-specific types
- Other feature-specific utilities

```
lib/
├── ai/                     # AI/ML functionality
│   ├── embeddings.ts       # Vector embedding generation
│   ├── gemini.ts           # Google Gemini client
│   └── semantic-retrieval.ts # Vector search
│
├── analytics/              # Analytics & reporting
│   └── queries.ts          # Analytics data queries
│
├── audit/                  # Audit logging
│   └── audit-logs.ts       # Audit trail actions
│
├── auth/                   # Authentication
│   ├── invitations.ts      # User invites
│   ├── rate-limit.ts       # Rate limiting
│   ├── secure-storage.ts   # Secure token storage
│   └── session-manager.ts  # Session handling
│
├── chat/                   # Chat system
│   ├── feedback-actions.ts # Feedback (helpful/not helpful)
│   ├── history-actions.ts  # Chat history (NEW - Phase 2)
│   ├── llm.ts              # LLM integration
│   ├── prompt.ts           # Prompt engineering
│   └── retrieval.ts        # Context retrieval
│
├── clarifications/         # HR clarification requests
│   └── actions.ts          # Clarification CRUD + pagination (NEW)
│
├── documents/              # Document management
│   ├── actions.ts          # Document CRUD
│   ├── embedding-actions.ts # Generate embeddings (NEW - Phase 2)
│   └── queries.ts          # Document queries (with embedding stats)
│
├── faq/                    # FAQ system
│   └── actions.ts          # FAQ management
│
├── processing/             # Document processing
│   ├── chunker.ts          # Text chunking
│   ├── pdf.ts              # PDF extraction
│   ├── process-document.ts # Main processor (auto-embeds - Phase 1)
│   └── text-cleaner.ts     # Text cleaning
│
├── supabase/               # Supabase clients
│   ├── client.ts           # Client-side client
│   ├── middleware.ts       # Middleware client
│   └── server.ts           # Server-side client
│
├── utils/                  # Shared utilities
│   └── dates.ts            # Date formatting
│
├── config.ts               # App configuration
└── utils.ts                # General utilities
```

---

## 🎨 Components (`components/`)

Organized by feature/domain:

```
components/
├── admin/                  # Admin-specific components
│   ├── AdminSidebar.tsx
│   └── ...
│
├── analytics/              # Analytics widgets
│   └── ...
│
├── auth/                   # Auth components
│   └── ...
│
├── chat/                   # Chat UI
│   └── PolicyChat.tsx      # Main chat component (Phase 2)
│
├── clarifications/         # Clarification components
│   └── ClarificationTable.tsx
│
├── documents/              # Document components
│   ├── DocumentTable.tsx   # Admin table (Phase 2)
│   └── EmbeddingStatusBadge.tsx # Status indicator (Phase 2)
│
├── employee/               # Employee-specific components
│   └── ...
│
├── layout/                 # Layout components
│   ├── EmployeeSidebar.tsx # (Phase 1 - added clarifications link)
│   └── ...
│
├── ui/                     # shadcn/ui primitives
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
│
└── ErrorBoundary.tsx       # Global error boundary
```

---

## 📄 Pages (`app/`)

Next.js 15 App Router structure:

```
app/
├── (auth)/                 # Auth routes (grouped)
│   ├── login/
│   ├── register/
│   └── signup/
│
├── admin/                  # Admin dashboard
│   ├── analytics/
│   ├── audit-logs/
│   ├── clarifications/     # Admin clarifications (Phase 2 - pagination)
│   ├── documents/          # Document management (Phase 2 - embeddings)
│   ├── employees/
│   ├── security/
│   └── settings/
│
├── employee/               # Employee portal
│   ├── chat/               # Policy chat
│   ├── clarifications/     # My clarifications (Phase 1 + Phase 2)
│   ├── help/
│   └── policies/
│
├── api/                    # API routes
│   ├── admin/
│   ├── chat/
│   └── employee/
│
├── invite/[token]/         # Invitation acceptance
│
├── layout.tsx              # Root layout
├── page.tsx                # Landing page
├── globals.css             # Global styles
├── error.tsx               # Error page
└── not-found.tsx           # 404 page
```

---

## 🎯 Key Principles

### **1. Feature-Based Organization**
Each feature lives in its own folder with all related code:
```
lib/clarifications/
├── actions.ts       # Server Actions (CREATE, UPDATE, DELETE)
├── queries.ts       # Read operations (if complex)
└── types.ts         # TypeScript types (if needed)
```

### **2. Separation of Concerns**
- **Actions** (`*-actions.ts`): Mutations, side effects
- **Queries** (`queries.ts`): Data fetching, read-only
- **Types** (`types.ts`): TypeScript definitions
- **Utils**: Pure utility functions

### **3. Server Actions Pattern**
```typescript
// lib/feature/actions.ts
'use server';

export async function createThing(data) {
  // 1. Auth check
  // 2. Validation
  // 3. Database operation
  // 4. Revalidate paths
  // 5. Return result
}
```

### **4. Pagination Pattern (NEW)**
```typescript
// Old method (simple)
getClarificationRequests()
  → Returns: ClarificationRequest[]

// New method (complex queries)
getClarificationRequestsPaginated({ 
  page: 1, 
  searchQuery: 'text' 
})
  → Returns: { requests, total, page, totalPages }
```

### **5. Component Organization**
```
components/
├── feature/           # Feature-specific components
├── ui/                # Reusable UI primitives
└── layout/            # Layout components
```

---

## 📦 Dependencies

### **Core Stack:**
- Next.js 15.0.3 (App Router)
- React 19
- TypeScript 5.9
- Supabase (PostgreSQL + Auth)
- Google Gemini (AI)
- shadcn/ui + Tailwind CSS

### **Key Libraries:**
- `@supabase/supabase-js` - Database client
- `@google/generative-ai` - Gemini AI
- `pdf-parse` - PDF extraction
- `zod` - Validation

---

## 🚀 Recent Changes (Phase 2)

### **New Files:**
- `lib/chat/history-actions.ts` - Chat history persistence
- `lib/documents/embedding-actions.ts` - Manual embedding generation
- `docs/PHASE2_COMPLETE.md` - Phase 2 summary

### **Enhanced Files:**
- `lib/clarifications/actions.ts` - Added pagination (`getClarificationRequestsPaginated`)
- `lib/documents/queries.ts` - Added embedding statistics
- `components/documents/DocumentTable.tsx` - Added embedding controls
- `app/admin/clarifications/page.tsx` - Added search + pagination

---

## 📝 Notes

### **Why This Structure?**
1. **Scalability**: Easy to add new features without cluttering
2. **Maintainability**: Related code lives together
3. **Discoverability**: Clear naming conventions
4. **Performance**: Code splitting by feature
5. **Testing**: Easy to test isolated features

### **Migration History:**
- All SQL files in `supabase/migrations/`
- Apply in order (step2 → step3 → ... → step8 → fixes)
- Each migration is idempotent (safe to re-run)

### **Documentation:**
- All docs in `docs/` folder
- Keep README minimal (overview only)
- Detailed docs in separate files

---

## 🔍 Finding Things

**Need to...**
- Add a new feature? → Create `lib/feature-name/`
- Add a server action? → Create `lib/feature/actions.ts`
- Add a page? → Add to `app/section/`
- Add a component? → Add to `components/feature/`
- Write docs? → Add to `docs/`
- Create migration? → Add to `supabase/migrations/`

---

*Last Updated: Phase 2 Complete (2026-07-11)*
