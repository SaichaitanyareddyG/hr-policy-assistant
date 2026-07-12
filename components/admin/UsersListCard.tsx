/**
 * Users List Card Component
 * 
 * Displays all users in the organization.
 * Shows role, department, status, join date.
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, UserCog } from 'lucide-react';
import type { UserRole } from '@/lib/auth/invitations';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  department_scope: string | null;
  created_at: string;
}

interface UsersListCardProps {
  users: User[];
  userRole: UserRole;
}

export function UsersListCard({ users }: UsersListCardProps) {
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ORG_ADMIN':
        return <Shield className="w-4 h-4" />;
      case 'DEPARTMENT_ADMIN':
        return <UserCog className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const variants: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
      ORG_ADMIN: 'default',
      DEPARTMENT_ADMIN: 'secondary',
      EMPLOYEE: 'outline',
    };

    const labels: Record<UserRole, string> = {
      ORG_ADMIN: 'Org Admin',
      DEPARTMENT_ADMIN: 'Dept Admin',
      EMPLOYEE: 'Employee',
    };

    return (
      <Badge variant={variants[role]} className="flex items-center gap-1">
        {getRoleIcon(role)}
        {labels[role]}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Members ({users.length})
        </CardTitle>
        <CardDescription>All users in your organization</CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No users yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-start justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {user.full_name}
                    </h4>
                    {getRoleBadge(user.role)}
                    {user.department_scope && (
                      <Badge variant="outline" className="text-xs">
                        {user.department_scope}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {user.department && (
                      <span>
                        <span className="font-medium">Department:</span>{' '}
                        {user.department}
                      </span>
                    )}
                    {user.location && (
                      <span>
                        <span className="font-medium">Location:</span> {user.location}
                      </span>
                    )}
                    {user.employment_type && (
                      <span>
                        <span className="font-medium">Type:</span>{' '}
                        {user.employment_type}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
