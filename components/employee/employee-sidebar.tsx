'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, FileText, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Home',
    href: '/employee',
    icon: Home,
  },
  {
    title: 'Ask Question',
    href: '/employee/chat',
    icon: MessageSquare,
  },
  {
    title: 'Browse Policies',
    href: '/employee/policies',
    icon: FileText,
  },
];

export function EmployeeSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r bg-white h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">PolicyPal AI</h1>
        <p className="text-sm text-gray-500 mt-1">Employee Portal</p>
      </div>
      <nav className="px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
