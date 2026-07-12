/**
 * Employee Chat Page
 * 
 * Route: /employee/chat
 * 
 * Provides an AI-powered chat interface for employees to ask
 * questions about HR policies and get instant answers.
 */

import { PolicyChat } from '@/components/chat/PolicyChat';

export const metadata = {
  title: 'PolicyPal AI - Ask HR Questions',
  description: 'Get instant answers to your HR policy questions',
};

export default function EmployeeChatPage() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900">PolicyPal AI</h1>
          <p className="text-sm text-gray-600 mt-1">
            Ask questions about HR policies and get instant, accurate answers
          </p>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 bg-gray-50 overflow-hidden">
        <PolicyChat />
      </div>
    </div>
  );
}
