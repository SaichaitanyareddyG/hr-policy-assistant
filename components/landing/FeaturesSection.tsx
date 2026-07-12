/**
 * Features Section Component
 * 
 * Displays key product features
 */

import { LucideIcon, Upload, MessageSquare, Shield, TrendingUp, Users, FileCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Upload,
    title: 'Upload HR Policy PDFs',
    description: 'Drag and drop your policy documents. We extract text, chunk it intelligently, and index everything for instant search.',
  },
  {
    icon: MessageSquare,
    title: 'Ask Questions in Natural Language',
    description: 'Employees type questions like "How many vacation days do I have?" and get instant answers grounded in your policies.',
  },
  {
    icon: FileCheck,
    title: 'Answers with Source References',
    description: 'Every answer includes citations showing exactly which policy and page the information came from.',
  },
  {
    icon: Shield,
    title: 'Role-Based Document Visibility',
    description: 'Control which policies are visible to all employees vs specific departments. Full privacy controls.',
  },
  {
    icon: TrendingUp,
    title: 'HR Analytics Dashboard',
    description: 'See which questions employees ask most, what AI can\'t answer, and which policies need updating.',
  },
  {
    icon: Users,
    title: 'Feedback & Clarification Workflow',
    description: 'Employees can mark answers as helpful/not helpful and request HR clarification when needed.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything you need for policy management
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload policies, let employees ask questions, track analytics, and improve
            documentation based on real feedback.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
