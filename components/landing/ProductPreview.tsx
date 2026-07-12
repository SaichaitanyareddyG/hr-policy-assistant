/**
 * Product Preview Section Component
 * 
 * Shows screenshots/mockups of HR dashboard and employee chat
 */

import { Card } from '@/components/ui/card';
import { BarChart3, MessageSquare } from 'lucide-react';

export function ProductPreview() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HR Dashboard Preview */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              HR Dashboard
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Track employee questions, identify knowledge gaps, and improve your policies with real analytics.
            </p>
          </div>

          <Card className="p-2 bg-gradient-to-br from-gray-100 to-gray-50 shadow-xl">
            <div className="bg-white rounded-lg p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
                  <p className="text-sm text-gray-600">See what employees need</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Questions Asked', value: '247' },
                  { label: 'Unanswered', value: '12' },
                  { label: 'Helpful Rate', value: '89%' },
                  { label: 'Active Policies', value: '24' },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-xl bg-gray-50 border">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <p className="text-sm font-medium text-blue-900">
                  💡 12 questions about "remote work policy" - consider updating documentation
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Employee Chat Preview */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Employee Chat Interface
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple, fast answers with source references. No more searching through PDFs.
            </p>
          </div>

          <Card className="p-2 bg-gradient-to-br from-gray-100 to-gray-50 shadow-xl">
            <div className="bg-white rounded-lg p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ask PolicyPal AI</h3>
                  <p className="text-sm text-gray-600">Get instant answers</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Example Question */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-2xl px-4 py-3 max-w-md">
                    <p className="text-sm">How many PTO days do I get per year?</p>
                  </div>
                </div>

                {/* Example Answer */}
                <div className="flex">
                  <div className="bg-gray-50 border rounded-2xl px-4 py-3 max-w-lg">
                    <p className="text-sm text-gray-900 mb-3">
                      Full-time employees receive 15 PTO days per year. Part-time employees receive PTO pro-rated based on hours worked.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Benefits Policy</span>
                      <span>Page 3</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
