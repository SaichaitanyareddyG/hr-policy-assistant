import { Users, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { AvatarWithInitials } from '@/components/ui/avatar-with-initials';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: 'ORG_ADMIN' | 'DEPARTMENT_ADMIN' | 'EMPLOYEE';
  department: string | null;
  org_id: string;
  created_at: string;
}

async function EmployeeList() {
  const supabase = await createClient();

  // Get current user's org_id
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Please log in to view employees</p>
      </div>
    );
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (profileError || !currentProfile) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Error loading profile. Please try again.</p>
      </div>
    );
  }

  // Fetch employees in the same organization
  const cp = currentProfile as any;
  const { data: employees, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('org_id', cp.org_id)
    .order('created_at', { ascending: false }) as { data: Employee[] | null; error: any };

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Error loading employees. Please try again.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Directory</CardTitle>
        <CardDescription>
          {employees?.length || 0} employee(s) in your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {employees && employees.length > 0 ? (
          <div className="space-y-3">
            {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                  role="article"
                  aria-label={`Employee: ${employee.full_name}`}
                >
                  <div className="flex items-center gap-4">
                    <AvatarWithInitials name={employee.full_name} size="lg" />
                    <div>
                      <p className="font-medium text-gray-900">{employee.full_name}</p>
                      <p className="text-sm text-gray-500">{employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{employee.role}</p>
                      {employee.department && (
                        <p className="text-xs text-gray-500">{employee.department}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No employees yet</p>
              <p className="text-sm mt-2">Invite employees to join your organization</p>
            </div>
          )}
        </CardContent>
      </Card>
  );
}

export default function AdminEmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage employee access and permissions</p>
        </div>
        <Link href="/admin/users">
          <Button aria-label="Invite new employee">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Employee
          </Button>
        </Link>
      </div>

      <Suspense fallback={
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      }>
        <EmployeeList />
      </Suspense>
    </div>
  );
}
