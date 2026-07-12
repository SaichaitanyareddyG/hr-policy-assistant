/**
 * Security Status Cards Component
 * 
 * Shows the status of all security features.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Shield, Lock, Eye, Zap, Database, AlertTriangle } from 'lucide-react';

export function SecurityStatusCards() {
  const securityFeatures = [
    {
      name: 'Private Storage',
      status: 'enabled',
      description: 'All PDFs stored in private Supabase bucket',
      icon: Lock,
    },
    {
      name: 'Signed URLs Only',
      status: 'enabled',
      description: 'Documents accessed via temporary signed URLs (10-min expiry)',
      icon: Shield,
    },
    {
      name: 'Row Level Security (RLS)',
      status: 'enabled',
      description: 'Database enforces organization-level isolation',
      icon: Database,
    },
    {
      name: 'Role-Based Access',
      status: 'enabled',
      description: 'Invite-based onboarding with role hierarchy',
      icon: Eye,
    },
    {
      name: 'AI Content Filtering',
      status: 'enabled',
      description: 'AI receives only audience-allowed snippets',
      icon: Zap,
    },
    {
      name: 'Audit Logging',
      status: 'enabled',
      description: 'All security events tracked and logged',
      icon: CheckCircle2,
    },
    {
      name: 'Rate Limiting',
      status: 'enabled',
      description: '20 chat questions/hour, 30 signed URLs/hour',
      icon: AlertTriangle,
    },
    {
      name: 'Public PDF Access',
      status: 'disabled',
      description: 'Direct public URLs blocked, permission checks required',
      icon: Lock,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Features
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {securityFeatures.map((feature) => (
            <div
              key={feature.name}
              className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    feature.status === 'enabled'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <feature.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                  </div>
                </div>
                <Badge
                  variant={feature.status === 'enabled' ? 'default' : 'secondary'}
                  className={
                    feature.status === 'enabled'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }
                >
                  {feature.status === 'enabled' ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
