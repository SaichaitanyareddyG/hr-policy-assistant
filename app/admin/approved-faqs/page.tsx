/**
 * Admin Approved FAQs Page
 * 
 * Manage HR-approved frequently asked questions.
 * FAQs are shown to employees before RAG search.
 */

import { requireAdmin } from '@/lib/auth/permissions';
import { getOrganizationFAQs } from '@/lib/faq/actions';
import { FAQManagementCard } from '@/components/admin/FAQManagementCard';
import { MessageCircleQuestion, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Approved FAQs | PolicyPal AI',
};

export default async function ApprovedFAQsPage() {
  // Require admin role
  await requireAdmin();

  // Fetch FAQs
  const faqsResult = await getOrganizationFAQs();
  const faqs = faqsResult.success ? faqsResult.faqs || [] : [];

  const activeFAQs = faqs.filter((faq) => faq.status === 'ACTIVE');
  const archivedFAQs = faqs.filter((faq) => faq.status === 'ARCHIVED');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
            <MessageCircleQuestion className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Approved FAQs</h1>
        </div>
        <p className="text-gray-600">
          Create HR-approved answers that show instantly to employees
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">How FAQs Work</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• When employees ask questions, FAQs are checked first</li>
              <li>• If a matching FAQ is found, it's shown instantly as "HR-approved answer"</li>
              <li>• If no FAQ matches, normal AI search runs through policy documents</li>
              <li>• You can target FAQs to specific departments, locations, or employment types</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Total FAQs</p>
          <p className="text-3xl font-bold text-gray-900">{faqs.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Active</p>
          <p className="text-3xl font-bold text-green-600">{activeFAQs.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Archived</p>
          <p className="text-3xl font-bold text-gray-500">{archivedFAQs.length}</p>
        </div>
      </div>

      {/* FAQ Management */}
      <FAQManagementCard faqs={faqs} />
    </div>
  );
}
