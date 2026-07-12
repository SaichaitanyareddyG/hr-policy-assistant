/**
 * Admin Users Management Page
 * 
 * ORG_ADMIN: View all users, send any invitations, manage team
 * DEPARTMENT_ADMIN: View org users, send EMPLOYEE invitations only
 */

import { requireAdmin } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { InviteUserCard } from '@/components/admin/InviteUserCard';
import { UsersListCard } from '@/components/admin/UsersListCard';
import { PendingInvitationsCard } from '@/components/admin/PendingInvitationsCard';

export const metadata = {
  title: 'User Management | PolicyPal AI',
};

export default async function UsersManagementPage() {
  // Require admin role (ORG_ADMIN or DEPARTMENT_ADMIN)
  const userProfile = await requireAdmin();

  const supabase = await createClient();

  // Fetch all users in the organization
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('org_id', userProfile.orgId)
    .order('created_at', { ascending: false });

  // Get organization name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', userProfile.orgId)
    .single();

  const o = org as any;
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage team members and send invitations for {o?.name || 'your organization'}
        </p>
      </div>

      {/* Invite User Card */}
      <InviteUserCard userRole={userProfile.role} />

      {/* Pending Invitations */}
      <PendingInvitationsCard userRole={userProfile.role} />

      {/* Users List */}
      <UsersListCard users={users || []} userRole={userProfile.role} />
    </div>
  );
}
