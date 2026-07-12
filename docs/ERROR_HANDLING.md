# Error Handling Best Practices

## Overview

This application implements comprehensive error handling following Next.js 15 and React best practices.

> **⚠️ Error Boundaries Not Working?**  
> See [ERROR_BOUNDARY_TROUBLESHOOTING.md](ERROR_BOUNDARY_TROUBLESHOOTING.md) for detailed explanation of why error boundaries don't catch async errors and how to fix it.

## Error Boundary Components

### 1. Global Error Boundaries (Automatic)

#### `app/error.tsx`
- Catches errors in any page or nested component
- Provides "Try Again" and "Go Home" options
- Shows error details in development mode
- Automatically used by Next.js

#### `app/global-error.tsx`
- Catches critical errors at root level (even in root layout)
- Last resort error handler
- Wraps entire HTML document

#### `app/not-found.tsx`
- Handles 404 errors gracefully
- Provides navigation back to home

#### `app/loading.tsx`
- Shows loading state during navigation/data fetching
- Works with React Suspense boundaries

### 2. Reusable ErrorBoundary Component

Located at: `components/ErrorBoundary.tsx`

#### Basic Usage

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function MyPage() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

#### Custom Fallback UI

```tsx
<ErrorBoundary
  fallback={
    <div className="p-4 text-center">
      <p>Failed to load this section</p>
    </div>
  }
>
  <MyComponent />
</ErrorBoundary>
```

#### With Error Logging

```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Send to error tracking service (e.g., Sentry)
    logErrorToService(error, errorInfo);
  }}
>
  <MyComponent />
</ErrorBoundary>
```

#### HOC Pattern

```tsx
import { withErrorBoundary } from '@/components/ErrorBoundary';

function MyComponent() {
  return <div>Content</div>;
}

export default withErrorBoundary(MyComponent);
```

## When to Use Each

### Use `app/error.tsx` (automatic)
- Already active for all pages
- No action needed
- Handles most errors automatically

### Use `<ErrorBoundary>` component
- ✅ Wrapping specific risky sections (API calls, complex calculations)
- ✅ Third-party components that might fail
- ✅ Dynamic content that could have loading issues
- ✅ When you want custom error UI for a specific section

**Example:**

```tsx
// admin/documents/page.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function DocumentsPage() {
  return (
    <div>
      <h1>Documents</h1>
      
      {/* Wrap risky section */}
      <ErrorBoundary>
        <DocumentList />
      </ErrorBoundary>
      
      {/* If DocumentList fails, rest of page still works */}
      <Footer />
    </div>
  );
}
```

### Use try-catch for async operations

```tsx
async function handleUpload() {
  try {
    const result = await uploadDocument(file);
    // Handle success
  } catch (error) {
    // Show user-friendly error message
    toast.error('Failed to upload document');
    console.error(error);
  }
}
```

## Error Monitoring

### Development
- Errors shown in browser console
- Error details displayed in UI
- Stack traces available

### Production
- Integrate error tracking service (Sentry, LogRocket, etc.)
- Update `onError` callbacks to send errors to service
- Remove error details from UI (security)

### Example: Sentry Integration

```tsx
// In app/error.tsx
useEffect(() => {
  // Log to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error);
  }
}, [error]);
```

## Best Practices

1. ✅ **Always wrap risky operations** in ErrorBoundary
2. ✅ **Provide helpful error messages** to users
3. ✅ **Log errors for debugging** (console.error or service)
4. ✅ **Give users recovery options** (Try Again, Go Home)
5. ✅ **Hide sensitive error details** in production
6. ✅ **Test error scenarios** during development
7. ✅ **Use loading states** to prevent unexpected errors
8. ✅ **Validate data** before processing to catch errors early

## Common Error Scenarios

### API Errors
```tsx
<ErrorBoundary fallback={<div>Failed to load data</div>}>
  <Suspense fallback={<LoadingSpinner />}>
    <DataComponent />
  </Suspense>
</ErrorBoundary>
```

### Form Submissions
```tsx
const handleSubmit = async () => {
  try {
    await submitForm(data);
    toast.success('Saved successfully');
  } catch (error) {
    toast.error('Failed to save. Please try again.');
  }
};
```

### File Uploads
```tsx
<ErrorBoundary
  onError={() => toast.error('Upload failed')}
>
  <FileUploader />
</ErrorBoundary>
```

## Testing Error Boundaries

```tsx
// Create a component that throws error for testing
function ErrorThrower() {
  throw new Error('Test error');
}

// Wrap in ErrorBoundary to see it working
<ErrorBoundary>
  <ErrorThrower />
</ErrorBoundary>
```

## Architecture

```
┌─────────────────────────────────────┐
│  app/global-error.tsx               │  ← Root level (critical errors)
│  └─ app/error.tsx                   │  ← Page level (most errors)
│     └─ <ErrorBoundary>              │  ← Section level (specific parts)
│        └─ try-catch                 │  ← Function level (async ops)
└─────────────────────────────────────┘
```

Each layer catches errors from layers below it, providing defense in depth.
