'use client';

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface EmployeeTopbarProps {
  userEmail?: string;
  userName?: string;
}

export function EmployeeTopbar({ userEmail, userName }: EmployeeTopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'EM';

  return (
    <div className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Hi, {userName || 'Employee'}!</h2>
        <p className="text-sm text-gray-500">How can I help you today?</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-green-100 text-green-600">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="font-medium text-gray-800">{userName || 'Employee'}</p>
            <p className="text-gray-500">{userEmail || 'employee@example.com'}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
