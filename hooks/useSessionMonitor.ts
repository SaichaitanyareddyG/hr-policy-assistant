/**
 * Session Monitor Hook
 * 
 * Monitors user session and handles auto logout on expiry or idle timeout
 * 
 * Features:
 * - Checks session validity periodically
 * - Tracks user activity (idle timeout)
 * - Shows warning before auto logout
 * - Automatically logs out expired/idle sessions
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AUTH_CONFIG } from '@/lib/config';

interface SessionMonitorState {
  isSessionValid: boolean;
  isIdle: boolean;
  showWarning: boolean;
  timeUntilLogout: number; // seconds
  lastActivity: Date;
}

export function useSessionMonitor() {
  const router = useRouter();
  const supabase = createClient();
  
  const [state, setState] = useState<SessionMonitorState>({
    isSessionValid: true,
    isIdle: false,
    showWarning: false,
    timeUntilLogout: 0,
    lastActivity: new Date(),
  });

  const lastActivityRef = useRef<Date>(new Date());
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const idleCheckIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    const now = new Date();
    lastActivityRef.current = now;
    setState(prev => ({ ...prev, lastActivity: now, isIdle: false, showWarning: false }));
  }, []);

  // Check if session is still valid
  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        // Session is invalid - auto logout
        await handleAutoLogout('Session expired');
        return false;
      }

      // Check if session is about to expire
      const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null;
      if (expiresAt) {
        const now = new Date();
        const timeUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
        
        // Show warning 5 minutes before expiry
        if (timeUntilExpiry > 0 && timeUntilExpiry <= AUTH_CONFIG.logoutWarningTime) {
          setState(prev => ({ 
            ...prev, 
            showWarning: true, 
            timeUntilLogout: timeUntilExpiry,
            isSessionValid: true 
          }));
        } else if (timeUntilExpiry <= 0) {
          // Session expired
          await handleAutoLogout('Session expired');
          return false;
        } else {
          setState(prev => ({ 
            ...prev, 
            showWarning: false, 
            isSessionValid: true 
          }));
        }
      }

      return true;
    } catch (error) {
      console.error('Session check error:', error);
      return false;
    }
  }, [supabase]);

  // Check for idle timeout
  const checkIdleTimeout = useCallback(() => {
    const now = new Date();
    const idleTime = Math.floor((now.getTime() - lastActivityRef.current.getTime()) / 1000);
    
    // Show warning when 80% of idle timeout is reached
    const warningThreshold = AUTH_CONFIG.idleTimeout * 0.8;
    
    if (idleTime >= AUTH_CONFIG.idleTimeout) {
      // User has been idle too long - auto logout
      handleAutoLogout('Logged out due to inactivity');
    } else if (idleTime >= warningThreshold) {
      const timeUntilLogout = AUTH_CONFIG.idleTimeout - idleTime;
      setState(prev => ({ 
        ...prev, 
        isIdle: true,
        showWarning: true, 
        timeUntilLogout 
      }));
    } else {
      setState(prev => ({ 
        ...prev, 
        isIdle: false,
        showWarning: false 
      }));
    }
  }, []);

  // Handle auto logout
  const handleAutoLogout = useCallback(async (reason: string) => {
    console.log(`Auto logout: ${reason}`);
    
    // Clear intervals
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }
    if (idleCheckIntervalRef.current) {
      clearInterval(idleCheckIntervalRef.current);
    }

    // Sign out
    await supabase.auth.signOut();
    
    // Update state
    setState({
      isSessionValid: false,
      isIdle: true,
      showWarning: false,
      timeUntilLogout: 0,
      lastActivity: new Date(),
    });

    // Redirect to login with reason
    router.push(`/login?reason=${encodeURIComponent(reason)}`);
  }, [supabase, router]);

  // Extend session (refresh token)
  const extendSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        console.error('Failed to extend session:', error);
        return false;
      }

      // Reset activity
      updateActivity();
      setState(prev => ({ 
        ...prev, 
        showWarning: false, 
        isSessionValid: true,
        isIdle: false 
      }));
      
      return true;
    } catch (error) {
      console.error('Session extension error:', error);
      return false;
    }
  }, [supabase, updateActivity]);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [updateActivity]);

  // Set up periodic session checks
  useEffect(() => {
    // Initial check
    checkSession();

    // Check session every 60 seconds
    sessionCheckIntervalRef.current = setInterval(
      checkSession,
      AUTH_CONFIG.sessionCheckInterval
    );

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
  }, [checkSession]);

  // Set up idle timeout checks
  useEffect(() => {
    // Check idle status every 10 seconds
    idleCheckIntervalRef.current = setInterval(checkIdleTimeout, 10000);

    return () => {
      if (idleCheckIntervalRef.current) {
        clearInterval(idleCheckIntervalRef.current);
      }
    };
  }, [checkIdleTimeout]);

  return {
    ...state,
    updateActivity,
    extendSession,
    logout: () => handleAutoLogout('Manual logout'),
  };
}
