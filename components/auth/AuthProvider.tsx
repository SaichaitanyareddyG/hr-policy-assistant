/**
 * Auth Provider Component
 * 
 * Client-side wrapper that provides session monitoring
 * and other auth-related features for authenticated users
 */

'use client';

import { SessionMonitor } from '@/components/auth/SessionMonitor';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <>
      {children}
      <SessionMonitor />
    </>
  );
}
