import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EmployeeSidebar } from '@/components/layout/EmployeeSidebar';
import { AppTopbar } from '@/components/layout/AppTopbar';
import { AuthProvider } from '@/components/auth/AuthProvider';

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email, org_id, organizations(name)')
    .eq('id', user.id)
    .single();

  const p = profile as any;
  if (!profile) {
    redirect('/login');
  }

  // If user is Admin, they shouldn't access employee routes by default
  if (p.role === 'ORG_ADMIN' || p.role === 'DEPARTMENT_ADMIN') {
    redirect('/admin');
  }

  const orgName = (p.organizations as any)?.name || 'Your Organization';

  return (
    <AuthProvider>
      <div className="flex h-screen bg-gray-50">
        <EmployeeSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppTopbar
            userEmail={p.email}
            userName={p.full_name}
            orgName={orgName}
            role="EMPLOYEE"
          />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
