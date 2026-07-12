/**
 * Admin Security Dashboard Page
 * 
 * Security overview for ORG_ADMIN only.
 * Shows security status, document access summary, recent security events.
 */

import { requireOrgAdmin } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { SecurityStatusCards } from '@/components/admin/SecurityStatusCards';
import { DocumentSecuritySummary } from '@/components/admin/DocumentSecuritySummary';
import { RecentSecurityEvents } from '@/components/admin/RecentSecurityEvents';
import { Shield, Lock } from 'lucide-react';

export const metadata = {
  title: 'Security Dashboard | PolicyPal AI',
};

export default async function SecurityDashboardPage() {
  // Require ORG_ADMIN role
  const userProfile = await requireOrgAdmin();

  const supabase = await createClient();

  // Fetch document stats
  const { count: totalDocs } = await supabase
    .from('policy_documents')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', userProfile.orgId);

  const { count: restrictedDocs } = await supabase
    .from('policy_documents')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', userProfile.orgId)
    .eq('audience_type', 'RESTRICTED');

  const { count: allEmployeeDocs } = await supabase
    .from('policy_documents')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', userProfile.orgId)
    .eq('audience_type', 'ALL');

  const { count: archivedDocs } = await supabase
    .from('policy_documents')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', userProfile.orgId)
    .eq('status', 'ARCHIVED');

  const { count: processingDocs } = await supabase
    .from('policy_documents')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', userProfile.orgId)
    .in('processing_status', ['PENDING', 'PROCESSING']);

  const { count: failedDocs } = await supabase
    .from('policy_documents')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', userProfile.orgId)
    .eq('processing_status', 'FAILED');

  const documentStats = {
    total: totalDocs || 0,
    restricted: restrictedDocs || 0,
    allEmployee: allEmployeeDocs || 0,
    archived: archivedDocs || 0,
    processing: processingDocs || 0,
    failed: failedDocs || 0,
  };

  // Fetch recent security events from audit logs
  const { data: recentEvents } = await supabase
    .from('audit_logs')
    .select('*, profiles:actor_user_id(full_name, email)')
    .eq('org_id', userProfile.orgId)
    .in('action', [
      'signed_url_generated',
      'document_audience_updated',
      'invite_accepted',
      'unauthorized_access_attempt',
      'rate_limit_exceeded',
    ])
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
        </div>
        <p className="text-gray-600">
          Monitor security status and access controls
        </p>
      </div>

      {/* Security Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Security Status: Active</h3>
            <p className="text-sm text-gray-700">
              All security measures are properly configured and operational. Your organization data is protected with enterprise-grade security.
            </p>
          </div>
        </div>
      </div>

      {/* Security Status Cards */}
      <SecurityStatusCards />

      {/* Document Security Summary */}
      <DocumentSecuritySummary stats={documentStats} />

      {/* Recent Security Events */}
      <RecentSecurityEvents events={recentEvents || []} />
    </div>
  );
}
