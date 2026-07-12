/**
 * Custom Hook for Async Error Handling
 * 
 * This hook allows async errors to be propagated to Error Boundaries.
 * Error boundaries don't catch async errors by default, but this hook
 * captures them in state and throws during render.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const throwError = useAsyncError();
 *   
 *   const fetchData = async () => {
 *     try {
 *       const response = await fetch('/api/data');
 *       if (!response.ok) throw new Error('Failed to fetch');
 *       // ... handle success
 *     } catch (error) {
 *       throwError(error); // This will trigger the error boundary
 *     }
 *   };
 * }
 * ```
 */

import { useState, useCallback } from 'react';

export function useAsyncError() {
  const [error, setError] = useState<Error | null>(null);

  const throwError = useCallback((err: unknown) => {
    setError(err instanceof Error ? err : new Error(String(err)));
  }, []);

  // Throw error during render to trigger error boundary
  if (error) {
    throw error;
  }

  return throwError;
}

/**
 * Wrapper function for async operations that automatically propagates errors
 * 
 * @example
 * ```tsx
 * const fetchData = withAsyncErrorHandling(async () => {
 *   const response = await fetch('/api/data');
 *   if (!response.ok) throw new Error('Failed');
 *   return response.json();
 * }, throwError);
 * ```
 */
export function withAsyncErrorHandling<T>(
  asyncFn: () => Promise<T>,
  throwError: (error: unknown) => void
): () => Promise<T | void> {
  return async () => {
    try {
      return await asyncFn();
    } catch (error) {
      throwError(error);
    }
  };
}

/**
 * Hook that combines error state with async error handling
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { error, setError, clearError } = useErrorState();
 *   
 *   // Throw error during render to trigger error boundary
 *   if (error) throw error;
 *   
 *   const fetchData = async () => {
 *     try {
 *       const data = await fetch('/api/data');
 *     } catch (err) {
 *       setError(err);
 *     }
 *   };
 * }
 * ```
 */
export function useErrorState() {
  const [error, setError] = useState<Error | null>(null);

  const setErrorSafe = useCallback((err: unknown) => {
    setError(err instanceof Error ? err : new Error(String(err)));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, setError: setErrorSafe, clearError };
}
