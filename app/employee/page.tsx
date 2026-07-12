import Link from 'next/link';
import { MessageSquare, FileText, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome to PolicyPal AI</h1>
        <p className="text-gray-500 mt-1">
          Your AI assistant for company policies and guidelines
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/employee/chat">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Ask a Question</CardTitle>
              <CardDescription>
                Get instant answers to your policy questions from our AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Asking
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/employee/policies">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Browse Policies</CardTitle>
              <CardDescription>
                View and search through all available company policy documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Policies
              </Button>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Ask your question</p>
              <p className="text-sm text-gray-500">
                Type your policy-related question in natural language
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Get instant answers</p>
              <p className="text-sm text-gray-500">
                AI searches through all policy documents and provides accurate answers
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">See the source</p>
              <p className="text-sm text-gray-500">
                Every answer includes references to the source document and section
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Common Questions</CardTitle>
          <CardDescription>Quick links to frequently asked topics</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <Button variant="outline" className="justify-start">
            Leave Policy
          </Button>
          <Button variant="outline" className="justify-start">
            Reimbursement Process
          </Button>
          <Button variant="outline" className="justify-start">
            Work From Home Policy
          </Button>
          <Button variant="outline" className="justify-start">
            Insurance Benefits
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
