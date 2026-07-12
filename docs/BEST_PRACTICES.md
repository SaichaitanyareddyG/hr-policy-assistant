# Best Practices Implementation Guide

This document outlines the best practices implemented in PolicyPal AI following Next.js 15, React 19, and modern web development standards.

## Table of Contents
1. [Component Patterns](#component-patterns)
2. [Performance Optimization](#performance-optimization)
3. [Accessibility](#accessibility)
4. [TypeScript Best Practices](#typescript-best-practices)
5. [Data Fetching](#data-fetching)
6. [Error Handling](#error-handling)
7. [Code Organization](#code-organization)

---

## Component Patterns

### ✅ Reusable Components

**DO:**
```tsx
// Create reusable components for common UI patterns
import { AvatarWithInitials } from '@/components/ui/avatar-with-initials';

<AvatarWithInitials name={userName} size="md" />
```

**DON'T:**
```tsx
// Avoid duplicating avatar logic across components
const getAvatarColor = (name: string) => { /* ... */ };
const initials = name.split(' ').map(n => n[0]).join('');
```

**Implemented In:**
- `components/ui/avatar-with-initials.tsx` - Reusable avatar component
- `components/layout/AppTopbar.tsx` - Uses AvatarWithInitials
- `app/admin/employees/page.tsx` - Uses AvatarWithInitials

### ✅ Component Memoization

**DO:**
```tsx
import { memo, useCallback } from 'react';

function MyComponent({ data }: Props) {
  const handleClick = useCallback(() => {
    // handler logic
  }, [/* dependencies */]);
  
  return <div>...</div>;
}

export const MyComponent = memo(MyComponentInternal);
```

**WHY:** Prevents unnecessary re-renders and improves performance.

**Implemented In:**
- `components/layout/AppTopbar.tsx` - Memoized with useCallback for handlers
- `components/layout/AdminSidebar.tsx` - Memoized component export
- `components/layout/EmployeeSidebar.tsx` - Memoized component export

---

## Performance Optimization

### ✅ Link Prefetching

**DO:**
```tsx
<Link href="/admin/documents" prefetch={true}>
  Documents
</Link>
```

**WHY:** Prefetches pages before navigation for instant page loads.

**Implemented In:**
- All sidebar navigation links
- Admin and Employee sidebars

### ✅ Loading States with Suspense

**DO:**
```tsx
import { Suspense } from 'react';
import LoadingComponent from './loading';

<Suspense fallback={<LoadingComponent />}>
  <DataComponent />
</Suspense>
```

**WHY:** Enables streaming and shows instant feedback to users.

**Implemented In:**
- `app/admin/employees/page.tsx` - Suspense boundary with skeleton
- `app/admin/loading.tsx` - Dashboard loading state
- `app/admin/documents/loading.tsx` - Documents loading state
- `app/admin/employees/loading.tsx` - Employees loading state
- `app/admin/analytics/loading.tsx` - Analytics loading state
- `app/employee/chat/loading.tsx` - Chat loading state

### ✅ Skeleton Screens

**DO:**
```tsx
<div className="space-y-3">
  {[1, 2, 3].map(i => (
    <Skeleton key={i} className="h-12 w-full" />
  ))}
</div>
```

**WHY:** Shows structure while loading, better UX than spinners.

**Implemented In:**
- `components/ui/skeleton.tsx` - Reusable skeleton component
- All loading.tsx files use skeleton patterns

---

## Accessibility

### ✅ ARIA Labels and Roles

**DO:**
```tsx
<aside role="navigation" aria-label="Admin navigation">
  <Link 
    href="/admin" 
    aria-current={isActive ? 'page' : undefined}
    aria-label="Navigate to dashboard"
  >
    Dashboard
  </Link>
</aside>

<Button aria-label="Invite new employee">
  <UserPlus className="w-4 h-4" />
  Invite
</Button>
```

**WHY:** Screen readers need semantic information for navigation.

**Implemented In:**
- `components/layout/AdminSidebar.tsx` - Navigation ARIA labels
- `components/layout/EmployeeSidebar.tsx` - Navigation ARIA labels
- `components/layout/AppTopbar.tsx` - Button ARIA labels
- `app/admin/employees/page.tsx` - Article roles and labels

### ✅ Icon Accessibility

**DO:**
```tsx
<User className="w-4 h-4" aria-hidden="true" />
<span>Profile</span> {/* Always include text with icons */}
```

**DON'T:**
```tsx
<User className="w-4 h-4" /> {/* Icon without text context */}
```

**WHY:** Icons are decorative and should be hidden from screen readers when paired with text.

**Implemented In:**
- All sidebar navigation items
- All buttons with icon+text combinations

---

## TypeScript Best Practices

### ✅ Centralized Type Definitions

**DO:**
```tsx
// types/user.ts
export type UserRole = 'ORG_ADMIN' | 'DEPARTMENT_ADMIN' | 'EMPLOYEE';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  org_id: string;
  // ... other fields
}

// Use in components
import type { UserProfile, UserRole } from '@/types/user';
```

**WHY:** Single source of truth for types, easier to maintain and refactor.

**Implemented In:**
- `types/user.ts` - User and profile types
- `types/documents.ts` - Document types
- Used throughout the application

### ✅ Type-Safe Helper Functions

**DO:**
```tsx
// types/user.ts
export const ROLE_LABELS: Record<UserRole, string> = {
  ORG_ADMIN: 'Organization Admin',
  DEPARTMENT_ADMIN: 'Department Admin',
  EMPLOYEE: 'Employee',
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}
```

**WHY:** Ensures exhaustive checking and prevents typos.

**Implemented In:**
- `types/user.ts` - Role helpers
- Used in admin dashboard and employee pages

### ✅ Component Props Interface

**DO:**
```tsx
interface AppTopbarProps {
  userName: string;
  userEmail: string;
  orgName?: string;
  role: 'ORG_ADMIN' | 'DEPARTMENT_ADMIN' | 'EMPLOYEE';
}

export function AppTopbar({ userName, userEmail, orgName, role }: AppTopbarProps) {
  // ...
}
```

**WHY:** Clear contracts, better IDE support, catch errors early.

**Implemented In:**
- All components have proper TypeScript interfaces

---

## Data Fetching

### ✅ Server Components for Data Fetching

**DO:**
```tsx
// app/admin/employees/page.tsx - Server Component (default)
async function EmployeeList() {
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from('profiles')
    .select('*');
  
  return <EmployeeTable employees={employees} />;
}
```

**DON'T:**
```tsx
'use client'; // Don't use client components for data fetching

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  
  useEffect(() => {
    fetch('/api/employees').then(/* ... */);
  }, []);
}
```

**WHY:** Server Components fetch data at build/request time, better performance, no client-side loading states needed.

**Implemented In:**
- `app/admin/employees/page.tsx` - Server Component with data fetching
- `app/admin/page.tsx` - Server Component for dashboard data
- Most admin pages use Server Components

### ✅ Error Handling in Data Fetching

**DO:**
```tsx
const { data: employees, error } = await supabase
  .from('profiles')
  .select('*');

if (error) {
  return (
    <div className="text-center py-12 text-red-500">
      <p>Error loading employees. Please try again.</p>
    </div>
  );
}

if (!employees || employees.length === 0) {
  return <EmptyState />;
}
```

**WHY:** Graceful error handling improves UX and prevents crashes.

**Implemented In:**
- `app/admin/employees/page.tsx` - Comprehensive error checking
- Most data fetching components follow this pattern

### ✅ Parallel Data Fetching

**DO:**
```tsx
const [policyCount, analytics, employees] = await Promise.all([
  getActivePolicyCount(orgId),
  getAdminAnalyticsSummary(),
  getEmployees(orgId),
]);
```

**WHY:** Fetches data in parallel instead of waterfall, faster page loads.

**Implemented In:**
- `app/admin/page.tsx` - Dashboard parallel data fetching

---

## Error Handling

### ✅ Error Boundaries

**Hierarchy:**
1. **global-error.tsx** - Root level (critical errors)
2. **error.tsx** - Page level (recoverable errors)
3. **ErrorBoundary component** - Section level (component errors)
4. **not-found.tsx** - 404 handling

**DO:**
```tsx
// Wrap risky sections with ErrorBoundary
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary fallback={<ErrorUI />} onError={logError}>
  <RiskyComponent />
</ErrorBoundary>
```

**WHY:** Prevents entire app crashes, provides better error UX.

**Implemented In:**
- `app/error.tsx` - Page-level error boundary
- `app/global-error.tsx` - Root-level error boundary
- `components/ErrorBoundary.tsx` - Reusable error boundary
- See `ERROR_HANDLING.md` for full details

---

## Code Organization

### ✅ File Structure

```
app/
  ├── (auth)/          # Auth group routes
  ├── admin/           # Admin routes
  │   ├── loading.tsx  # Route-level loading
  │   ├── error.tsx    # Route-level error
  │   └── employees/
  │       ├── page.tsx
  │       └── loading.tsx
  └── employee/        # Employee routes

components/
  ├── layout/          # Layout components
  ├── ui/              # Reusable UI components
  ├── admin/           # Admin-specific components
  └── chat/            # Feature-specific components

lib/
  ├── supabase/        # Supabase utilities
  ├── auth/            # Auth utilities
  ├── documents/       # Document utilities
  └── utils/           # General utilities

types/
  ├── user.ts          # User types
  ├── documents.ts     # Document types
  └── index.ts         # Type exports
```

### ✅ Import Organization

**DO:**
```tsx
// 1. External dependencies
import { Suspense } from 'react';
import Link from 'next/link';

// 2. Internal components
import { Button } from '@/components/ui/button';
import { AvatarWithInitials } from '@/components/ui/avatar-with-initials';

// 3. Utilities and types
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types/user';

// 4. Icons and assets
import { User, LogOut } from 'lucide-react';
```

**WHY:** Consistent, readable, easier to manage imports.

---

## Summary of Improvements

### Performance ⚡
- ✅ React.memo on layout components
- ✅ useCallback for event handlers
- ✅ Link prefetching enabled
- ✅ Suspense boundaries for streaming
- ✅ Skeleton loading states
- ✅ Server Components for data fetching
- ✅ Parallel data fetching with Promise.all

### Accessibility ♿
- ✅ ARIA labels on navigation
- ✅ ARIA roles on semantic elements
- ✅ aria-current for active links
- ✅ aria-hidden on decorative icons
- ✅ Proper heading hierarchy
- ✅ Keyboard navigation support

### Code Quality 📝
- ✅ Centralized TypeScript types
- ✅ Reusable UI components
- ✅ Consistent error handling
- ✅ Proper error boundaries
- ✅ Native utilities (no unnecessary deps)
- ✅ Clean import organization

### User Experience 🎨
- ✅ Beautiful color-coded avatars
- ✅ Instant navigation with prefetch
- ✅ Smooth loading states
- ✅ Graceful error messages
- ✅ Consistent design patterns
- ✅ Hover and focus states

---

## Next Steps for Further Improvement

1. **Testing**
   - Add unit tests for utilities
   - Add integration tests for key flows
   - Add E2E tests with Playwright

2. **Performance Monitoring**
   - Add analytics for Core Web Vitals
   - Monitor bundle size
   - Track API response times

3. **Accessibility Audit**
   - Run automated accessibility tests
   - Manual keyboard navigation testing
   - Screen reader testing

4. **Documentation**
   - Add JSDoc comments to utilities
   - Document custom hooks
   - Create component storybook

---

**Last Updated**: May 28, 2026  
**Maintained By**: PolicyPal AI Development Team
