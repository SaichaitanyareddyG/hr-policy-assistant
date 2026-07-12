/**
 * Admin Audit Logs Page
 * 
 * View all security-relevant actions in the organization.
 * ORG_ADMIN sees all logs, DEPARTMENT_ADMIN sees limited logs.
 */

import { requireAdmin } from '@/lib/auth/permissions';
import { getOrganizationAuditLogs } from '@/lib/audit/audit-logs';
import { AuditLogsTable } from '@/components/admin/AuditLogsTable';
import { Shield, Activity } from 'lucide-react';

export const metadata = {
  title: 'Audit Logs | PolicyPal AI',
};

export default async function AuditLogsPage() {
  // Require admin role
  const userProfile = await requireAdmin();

  // Fetch audit logs (first 100)
  const logsResult = await getOrganizationAuditLogs(100, 0);

  const logs = logsResult.success ? logsResult.logs || [] : [];
  const total = logsResult.success ? logsResult.total || 0 : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        </div>
        <p className="text-gray-600">
          Track all security-relevant actions in your organization
        </p>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-gray-600">Total Events</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{total}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-gray-600">Showing</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{logs.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <p className="text-sm font-medium text-gray-600">Your Role</p>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {userProfile.role === 'ORG_ADMIN' ? 'Full Access' : 'Limited Access'}
          </p>
        </div>
      </div>

      {/* Audit Logs Table */}
      <AuditLogsTable logs={logs} userRole={userProfile.role} />
    </div>
  );
}
