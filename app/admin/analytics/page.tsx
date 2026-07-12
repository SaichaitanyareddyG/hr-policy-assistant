/**
 * Admin Analytics Page
 * 
 * Provides HR admins with insights into employee questions,
 * answer quality, and policy document usage.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getAdminAnalyticsSummary,
  getTopQuestions,
  getUnansweredQuestions,
  getNotHelpfulFeedback,
  getSourceUsage,
} from '@/lib/analytics/queries';
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { TopQuestionsTable } from '@/components/analytics/TopQuestionsTable';
import { UnansweredQuestionsTable } from '@/components/analytics/UnansweredQuestionsTable';
import { FeedbackTable } from '@/components/analytics/FeedbackTable';
import { SourceUsageTable } from '@/components/analytics/SourceUsageTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  FileText,
} from 'lucide-react';

export const metadata = {
  title: 'Analytics | PolicyPal AI',
  description: 'HR analytics and insights',
};

async function AnalyticsContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const p = profile as any;
  if (!profile || (p.role !== 'ORG_ADMIN' && p.role !== 'DEPARTMENT_ADMIN')) {
    redirect('/employee/chat');
  }

  // Fetch all analytics data
  const [summary, topQuestions, unansweredQuestions, notHelpfulFeedback, sourceUsage] =
    await Promise.all([
      getAdminAnalyticsSummary(),
      getTopQuestions(10),
      getUnansweredQuestions(),
      getNotHelpfulFeedback(),
      getSourceUsage(),
    ]);

  const helpfulRate = summary?.helpfulRate || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-500 mt-1">
          Insights into employee questions and AI performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Total Questions"
          value={summary?.totalQuestions || 0}
          description="All time"
          icon={MessageSquare}
        />
        <AnalyticsCard
          title="Unanswered"
          value={summary?.unansweredQuestions || 0}
          description="Needs attention"
          icon={AlertCircle}
        />
        <AnalyticsCard
          title="Helpful Rate"
          value={`${helpfulRate.toFixed(1)}%`}
          description={`${summary?.helpfulFeedback || 0} helpful / ${summary?.notHelpfulFeedback || 0} not helpful`}
          icon={helpfulRate >= 75 ? ThumbsUp : ThumbsDown}
        />
        <AnalyticsCard
          title="Active Documents"
          value={summary?.totalDocuments || 0}
          description={`${summary?.totalEmployees || 0} employees`}
          icon={FileText}
        />
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="top-questions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="top-questions">Top Questions</TabsTrigger>
          <TabsTrigger value="unanswered">
            Unanswered ({unansweredQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="feedback">
            Not Helpful ({notHelpfulFeedback.length})
          </TabsTrigger>
          <TabsTrigger value="sources">Source Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="top-questions">
          <Card>
            <CardHeader>
              <CardTitle>Top Asked Questions</CardTitle>
              <CardDescription>
                Most frequently asked questions by employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopQuestionsTable questions={topQuestions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unanswered">
          <Card>
            <CardHeader>
              <CardTitle>Unanswered Questions</CardTitle>
              <CardDescription>
                Questions where AI could not find a relevant answer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UnansweredQuestionsTable questions={unansweredQuestions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Not Helpful Feedback</CardTitle>
              <CardDescription>
                Answers marked as not helpful by employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeedbackTable feedback={notHelpfulFeedback} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Policy Document Usage</CardTitle>
              <CardDescription>
                Most frequently cited policy documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SourceUsageTable sources={sourceUsage} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
