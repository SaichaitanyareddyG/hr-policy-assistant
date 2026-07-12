/**
 * Admin Settings Page
 * 
 * Placeholder for organization settings and configuration
 */

import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users2, Shield, Plug } from 'lucide-react';

export default function AdminSettingsPage() {
  const settingsSections = [
    {
      icon: Building2,
      title: 'Organization Settings',
      description: 'Manage your organization name, logo, and basic information.',
      status: 'Coming soon',
    },
    {
      icon: Users2,
      title: 'Manage Roles',
      description: 'Configure HR admin permissions and employee access levels.',
      status: 'Coming soon',
    },
    {
      icon: Shield,
      title: 'Data Privacy',
      description: 'Control data retention, export options, and compliance settings.',
      status: 'Coming soon',
    },
    {
      icon: Plug,
      title: 'Integrations',
      description: 'Connect with Slack, Teams, or other workplace tools in the future.',
      status: 'Planned',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your PolicyPal AI instance"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription className="mt-1.5">
                      {section.description}
                    </CardDescription>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {section.status}
                </span>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
          <CardDescription>
            Your PolicyPal AI is running with these settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between py-3 border-b">
            <span className="text-sm font-medium text-gray-700">Data Storage</span>
            <span className="text-sm text-gray-600">Self-hosted Supabase</span>
          </div>
          <div className="flex justify-between py-3 border-b">
            <span className="text-sm font-medium text-gray-700">AI Model</span>
            <span className="text-sm text-gray-600">Gemini 1.5 Flash</span>
          </div>
          <div className="flex justify-between py-3 border-b">
            <span className="text-sm font-medium text-gray-700">Embeddings</span>
            <span className="text-sm text-gray-600">text-embedding-004 (768d)</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-sm font-medium text-gray-700">Vector Database</span>
            <span className="text-sm text-gray-600">Supabase pgvector</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
