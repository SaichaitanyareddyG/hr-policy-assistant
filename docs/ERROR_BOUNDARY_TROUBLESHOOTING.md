# Error Boundary Troubleshooting Guide

## Why Error Boundaries Don't Catch Certain Errors

Error boundaries in React have specific limitations. Understanding these is crucial for proper error handling.

---

## What Error Boundaries CATCH ✅

Error boundaries **DO** catch errors in:

1. **Rendering phase** - Errors that occur while rendering JSX
   ```tsx
   function MyComponent() {
     // ✅ This will be caught
     throw new Error('Rendering error');
     return <div>Content</div>;
   }
   ```

2. **Lifecycle methods** (Class components only)
   ```tsx
   class MyComponent extends React.Component {
     componentDidMount() {
       // ✅ This will be caught
       throw new Error('Lifecycle error');
     }
   }
   ```

3. **Constructor** (Class components only)
   ```tsx
   class MyComponent extends React.Component {
     constructor(props) {
       super(props);
       // ✅ This will be caught
       throw new Error('Constructor error');
     }
   }
   ```

---

## What Error Boundaries DON'T CATCH ❌

### 1. Event Handlers ❌

**Problem:**
```tsx
function MyComponent() {
  const handleClick = () => {
    // ❌ Error boundary WON'T catch this
    throw new Error('Click error');
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

**Solution:**
```tsx
function MyComponent() {
  const throwError = useAsyncError();
  
  const handleClick = () => {
    try {
      // Your code
      throw new Error('Click error');
    } catch (error) {
      throwError(error); // ✅ Now it will be caught
    }
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

### 2. Async Code (Promises, fetch, setTimeout) ❌

**Problem:**
```tsx
function MyComponent() {
  useEffect(() => {
    // ❌ Error boundary WON'T catch this
    fetch('/api/data')
      .then(res => {
        if (!res.ok) throw new Error('Fetch failed');
      });
  }, []);
}
```

**Solution - Option 1: Error State + Throw in Render**
```tsx
function MyComponent() {
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => {
        if (!res.ok) throw new Error('Fetch failed');
      })
      .catch(err => setError(err)); // Capture in state
  }, []);
  
  // ✅ Throw during render to trigger error boundary
  if (error) throw error;
  
  return <div>Content</div>;
}
```

**Solution - Option 2: Custom Hook**
```tsx
import { useAsyncError } from '@/hooks/useAsyncError';

function MyComponent() {
  const throwError = useAsyncError();
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => {
        if (!res.ok) throw new Error('Fetch failed');
      })
      .catch(throwError); // ✅ Now it will be caught
  }, []);
}
```

### 3. Server Components (SSR) ❌

**Problem:**
```tsx
// app/page.tsx - Server Component
async function ServerPage() {
  // ❌ Client-side error boundary WON'T catch this
  const data = await fetch('/api/data');
  if (!data.ok) throw new Error('Server error');
}
```

**Solution:**
Use `error.tsx` for Server Component errors:
```tsx
// app/error.tsx
'use client';

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 4. setTimeout/setInterval ❌

**Problem:**
```tsx
function MyComponent() {
  useEffect(() => {
    setTimeout(() => {
      // ❌ Error boundary WON'T catch this
      throw new Error('Timeout error');
    }, 1000);
  }, []);
}
```

**Solution:**
```tsx
function MyComponent() {
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setTimeout(() => {
      try {
        throw new Error('Timeout error');
      } catch (err) {
        setError(err);
      }
    }, 1000);
  }, []);
  
  // ✅ Throw during render
  if (error) throw error;
}
```

---

## Best Practices for Error Handling

### 1. Use Error Boundaries for Component Errors

```tsx
<ErrorBoundary fallback={<ErrorUI />}>
  <MyComponent />
</ErrorBoundary>
```

### 2. Use Try-Catch for Async Code

```tsx
const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Fetch failed');
    return response.json();
  } catch (error) {
    // Option A: Show inline error
    setError(error);
    
    // Option B: Propagate to error boundary
    throwError(error);
  }
};
```

### 3. Use error.tsx for Route-Level Errors

```tsx
// app/admin/documents/error.tsx
'use client';

export default function DocumentsError({ error, reset }) {
  return (
    <div>
      <h2>Failed to load documents</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  );
}
```

### 4. Create Custom Hooks for Async Errors

```tsx
// hooks/useAsyncError.ts
export function useAsyncError() {
  const [error, setError] = useState(null);
  
  const throwError = useCallback((err) => {
    setError(err instanceof Error ? err : new Error(String(err)));
  }, []);
  
  if (error) throw error;
  
  return throwError;
}
```

---

## Error Boundary Hierarchy

```
app/
├── global-error.tsx          # ← Catches ALL errors (last resort)
├── error.tsx                 # ← Catches page-level errors
└── admin/
    ├── error.tsx             # ← Catches admin section errors
    └── documents/
        ├── error.tsx         # ← Catches documents page errors (most specific)
        └── page.tsx          # ← Your component
```

**Priority**: Most specific → Least specific

---

## Common Patterns in PolicyPal AI

### Pattern 1: Fetch with Error Propagation

```tsx
function MyComponent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch(setError);
  }, []);
  
  // Propagate to error boundary
  if (error) throw error;
  
  return <div>{/* render data */}</div>;
}
```

### Pattern 2: Action with Inline Error

```tsx
const handleDelete = async (id: string) => {
  try {
    const result = await deleteSomething(id);
    if (!result.success) {
      // Show inline error instead of error boundary
      alert(`Failed: ${result.error}`);
      return;
    }
    // Success handling
  } catch (error) {
    console.error(error);
    alert('An error occurred. Please try again.');
  }
};
```

### Pattern 3: Server Component with Error Route

```tsx
// app/admin/page.tsx - Server Component
async function AdminDashboard() {
  const supabase = await createClient();
  
  // Errors here are caught by app/admin/error.tsx
  const { data, error } = await supabase.from('profiles').select('*');
  
  if (error) throw new Error('Failed to load profiles');
  
  return <div>{/* render */}</div>;
}
```

---

## Debugging Checklist

When error boundaries don't work:

- [ ] Is the error in an event handler? → Use try-catch
- [ ] Is the error in async code? → Capture in state, throw in render
- [ ] Is the error in a Server Component? → Use error.tsx
- [ ] Is the error caught by try-catch? → Either show inline or propagate
- [ ] Is error.tsx a Client Component? → Must have `'use client'`
- [ ] Is the error thrown during render? → Only render-time errors are caught

---

## Tools We've Implemented

### 1. Custom Hook: useAsyncError
**File**: `hooks/useAsyncError.ts`
```tsx
const throwError = useAsyncError();
// Use in async code to propagate to error boundary
```

### 2. Error Pages for Routes
- `app/error.tsx` - Page-level
- `app/global-error.tsx` - Root-level
- `app/admin/documents/error.tsx` - Documents-specific

### 3. ErrorBoundary Component
**File**: `components/ErrorBoundary.tsx`
```tsx
<ErrorBoundary fallback={<MyError />}>
  <RiskyComponent />
</ErrorBoundary>
```

---

## Summary

**Remember:**
1. Error boundaries catch **render errors** only
2. Async errors need **manual propagation** (state → throw)
3. Event handler errors need **try-catch**
4. Use `error.tsx` for **Server Component** errors
5. Use custom hooks for **reusable patterns**

**Files to Reference:**
- [ERROR_HANDLING.md](ERROR_HANDLING.md) - General error handling guide
- [hooks/useAsyncError.ts](hooks/useAsyncError.ts) - Custom error hook
- [components/ErrorBoundary.tsx](components/ErrorBoundary.tsx) - Reusable error boundary

---

**Last Updated**: May 28, 2026  
**Status**: Production-ready error handling patterns implemented
