/**
 * Employee Help Page
 * 
 * Placeholder for employee help and HR contact
 */

import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Mail, FileQuestion, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmployeeHelpPage() {
  return (
    <div>
      <PageHeader
        title="Help & Contact HR"
        description="Get assistance with PolicyPal AI or reach out to your HR team"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* How to Use */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileQuestion className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">How to Use PolicyPal AI</CardTitle>
                <CardDescription className="mt-1.5">
                  Learn how to ask questions and get the most accurate answers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>1. Ask specific questions</strong></p>
              <p className="text-xs pl-4">
                Instead of "Tell me about PTO", ask "How many PTO days do I get per year?"
              </p>
              <p><strong>2. Check the sources</strong></p>
              <p className="text-xs pl-4">
                Every answer includes the policy document and page number where the info came from
              </p>
              <p><strong>3. Provide feedback</strong></p>
              <p className="text-xs pl-4">
                Mark answers as helpful or not helpful to improve responses
              </p>
              <p><strong>4. Ask HR for clarification</strong></p>
              <p className="text-xs pl-4">
                If AI can't answer or the answer isn't helpful, send your question directly to HR
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact HR */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Contact HR Team</CardTitle>
                <CardDescription className="mt-1.5">
                  Reach out for personalized assistance or policy questions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Mail className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Email HR</p>
                <p className="text-xs text-gray-600">hr@yourcompany.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Phone className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Call HR</p>
                <p className="text-xs text-gray-600">ext. 1234</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Note: Contact information is managed by your HR admin. This is a placeholder.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Placeholder */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Common questions about using PolicyPal AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Q: Where does PolicyPal AI get its answers?
            </p>
            <p className="text-sm text-gray-600">
              A: All answers come exclusively from policy documents uploaded by your HR team.
              The AI doesn't make up information or search the internet.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Q: Can I trust the answers?
            </p>
            <p className="text-sm text-gray-600">
              A: Yes! Every answer includes source references showing which policy document and
              page the information came from. Always check the sources for full context.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Q: What if I can't find an answer?
            </p>
            <p className="text-sm text-gray-600">
              A: Use the "Ask HR" button to send your question directly to the HR team for
              personalized assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
