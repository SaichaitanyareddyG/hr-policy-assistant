/**
 * App Topbar Component
 * 
 * Top navigation bar with user info and logout
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AvatarWithInitials } from '@/components/ui/avatar-with-initials';
import { memo, useCallback } from 'react';

interface AppTopbarProps {
  userName: string;
  userEmail: string;
  orgName?: string;
  role: 'ORG_ADMIN' | 'DEPARTMENT_ADMIN' | 'EMPLOYEE';
}

function AppTopbarComponent({ userName, userEmail, orgName, role }: AppTopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }, [router, supabase]);

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div>
        {orgName && (
          <div>
            <p className="text-sm font-medium text-gray-900">{orgName}</p>
            <p className="text-xs text-gray-500">
              {role === 'ORG_ADMIN'
                ? 'Organization Admin'
                : role === 'DEPARTMENT_ADMIN'
                ? 'Department Admin'
                : 'Employee'}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative h-10 w-10 rounded-full hover:opacity-80 transition-opacity"
              aria-label="User menu"
            >
              <AvatarWithInitials name={userName} size="md" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" aria-label="View profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600" aria-label="Log out">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// Memoized export for performance
export const AppTopbar = memo(AppTopbarComponent);
