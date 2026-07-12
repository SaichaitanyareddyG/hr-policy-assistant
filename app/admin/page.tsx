import { FileText, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { DashboardCard } from '@/components/admin/dashboard-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { getActivePolicyCount } from '@/lib/documents/queries';
import { getAdminAnalyticsSummary } from '@/lib/analytics/queries';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Get current user and profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const p = profile as any;
  if (!profile || (p.role !== 'ORG_ADMIN' && p.role !== 'DEPARTMENT_ADMIN')) {
    redirect('/employee');
  }

  // Fetch real counts
  const [policyCount, analytics] = await Promise.all([
    getActivePolicyCount(p.org_id!),
    getAdminAnalyticsSummary(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your policy management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Policy Documents"
          value={policyCount}
          icon={FileText}
          description="Total active policies"
        />
        <DashboardCard
          title="Employees"
          value={analytics?.totalEmployees || 0}
          icon={Users}
          description="Active users"
        />
        <DashboardCard
          title="Questions Asked"
          value={analytics?.totalQuestions || 0}
          icon={MessageSquare}
          description="Total queries all time"
        />
        <DashboardCard
          title="Unanswered Questions"
          value={analytics?.unansweredQuestions || 0}
          icon={AlertCircle}
          description="Needs attention"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>HR Admin Actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/admin/documents/upload" className="block">
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <p className="font-medium text-sm">Upload Policy</p>
                <p className="text-xs text-gray-500 mt-1">Add new policy PDFs</p>
              </div>
            </a>
            <a href="/admin/analytics" className="block">
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <p className="font-medium text-sm">View Analytics</p>
                <p className="text-xs text-gray-500 mt-1">Employee questions and feedback</p>
              </div>
            </a>
            <a href="/admin/clarifications" className="block">
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <p className="font-medium text-sm">Review Clarifications</p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics?.openClarifications || 0} open requests
                </p>
              </div>
            </a>
            <a href="/admin/employees" className="block">
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <p className="font-medium text-sm">Manage Employees</p>
                <p className="text-xs text-gray-500 mt-1">View and edit employee access</p>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
            <CardDescription>AI Performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">Helpful Rate</p>
                <p className="text-sm font-semibold">{analytics?.helpfulRate.toFixed(1) || 0}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${analytics?.helpfulRate || 0}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-2 bg-green-50 rounded">
                <p className="text-2xl font-bold text-green-600">{analytics?.helpfulFeedback || 0}</p>
                <p className="text-xs text-gray-600">Helpful</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <p className="text-2xl font-bold text-red-600">{analytics?.notHelpfulFeedback || 0}</p>
                <p className="text-xs text-gray-600">Not Helpful</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
