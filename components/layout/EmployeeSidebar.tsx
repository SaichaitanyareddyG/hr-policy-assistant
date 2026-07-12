/**
 * Employee Sidebar Component
 * 
 * Navigation sidebar for Employee dashboard
 * Optimized with React.memo for performance
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { memo } from 'react';
import {
  MessageSquare,
  FileText,
  HelpCircle,
  Bot,
  MessageCircleQuestion,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  {
    name: 'Ask Policy AI',
    href: '/employee/chat',
    icon: MessageSquare,
  },
  {
    name: 'Browse Policies',
    href: '/employee/policies',
    icon: FileText,
  },
  {
    name: 'My Clarifications',
    href: '/employee/clarifications',
    icon: MessageCircleQuestion,
  },
  {
    name: 'Help & Contact',
    href: '/employee/help',
    icon: HelpCircle,
  },
];

function EmployeeSidebarComponent() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-white h-screen sticky top-0 flex flex-col" role="navigation" aria-label="Employee navigation">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center" aria-hidden="true">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">PolicyPal AI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1" aria-label="Main navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-gray-500 text-center">
          Employee Portal
        </p>
      </div>
    </aside>
  );
}

// Memoized export for performance
export const EmployeeSidebar = memo(EmployeeSidebarComponent);
