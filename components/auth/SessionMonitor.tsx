/**
 * Session Expiry Warning Component
 * 
 * Shows a warning dialog when session is about to expire or user is idle
 * Allows user to extend session or logout
 */

'use client';

import { useEffect, useState } from 'react';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, AlertTriangle } from 'lucide-react';

export function SessionMonitor() {
  const { showWarning, timeUntilLogout, isIdle, extendSession, logout } = useSessionMonitor();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(showWarning);
  }, [showWarning]);

  const handleExtendSession = async () => {
    const success = await extendSession();
    if (success) {
      setOpen(false);
    }
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
    }
    return `${secs} second${secs !== 1 ? 's' : ''}`;
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {isIdle ? (
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            )}
            <div>
              <AlertDialogTitle>
                {isIdle ? 'Are you still there?' : 'Session Expiring Soon'}
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-base pt-4">
            {isIdle ? (
              <>
                You've been inactive for a while. For your security, you will be automatically 
                logged out in <strong className="text-gray-900">{formatTime(timeUntilLogout)}</strong>.
              </>
            ) : (
              <>
                Your session is about to expire. You will be automatically logged out in{' '}
                <strong className="text-gray-900">{formatTime(timeUntilLogout)}</strong> for security reasons.
              </>
            )}
          </AlertDialogDescription>
          <div className="pt-2">
            <p className="text-sm text-gray-600">
              Click "Stay Logged In" to continue your session, or "Logout" to sign out now.
            </p>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout} className="mr-2">
            Logout Now
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleExtendSession}>
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
