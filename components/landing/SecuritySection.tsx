/**
 * Security Section Component
 * 
 * Highlights security and privacy features
 */

import { Shield, Lock, Database, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function SecuritySection() {
  const securityFeatures = [
    {
      icon: Database,
      title: 'Your data stays yours',
      description: 'All data is stored in your own Supabase instance. We never see or store your policies.',
    },
    {
      icon: Shield,
      title: 'Enterprise-grade security',
      description: 'Built on Supabase with row-level security policies. Every query is scoped to your organization.',
    },
    {
      icon: Lock,
      title: 'Role-based access control',
      description: 'HR admins control document visibility. Employees only see what you allow them to see.',
    },
    {
      icon: Eye,
      title: 'Full audit trail',
      description: 'Track every question asked and every answer given. Complete transparency for compliance.',
    },
  ];

  return (
    <section id="security" className="py-20 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Secure by design
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Your policy data is sensitive. We built PolicyPal AI with security and privacy as the foundation.
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {securityFeatures.map((feature, index) => (
            <Card key={index} className="p-6 bg-gray-800 border-gray-700">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Trust Message */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            Built for internal HR teams. Self-hosted with open architecture. No vendor lock-in.
          </p>
        </div>
      </div>
    </section>
  );
}
