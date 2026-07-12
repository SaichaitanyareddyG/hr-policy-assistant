/**
 * Employee Clarifications Page
 * 
 * Allows employees to view their clarification requests and HR responses
 */

'use client';

import { useState, useEffect } from 'react';
import { getClarificationRequestsPaginated, ClarificationRequestsResult } from '@/lib/clarifications/actions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircleQuestion, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function getStatusBadge(status: string) {
  switch (status) {
    case 'OPEN':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case 'IN_REVIEW':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          In Review
        </Badge>
      );
    case 'RESOLVED':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Resolved
        </Badge>
      );
    case 'DISMISSED':
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          Dismissed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EmployeeClarificationsPage() {
  const [result, setResult] = useState<ClarificationRequestsResult>({
    requests: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadClarifications = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const data = await getClarificationRequestsPaginated({ page, pageSize: 20 });

    if (append) {
      setResult({
        ...data,
        requests: [...result.requests, ...data.requests],
      });
      setLoadingMore(false);
    } else {
      setResult(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClarifications();
  }, []);

  const hasMore = result.page < result.totalPages;
  const clarifications = result.requests;

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <MessageCircleQuestion className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Clarification Requests</h1>
            <p className="text-sm text-gray-600">
              View your questions sent to HR and their responses
              {result.total > 0 && (
                <span className="ml-2 text-gray-500">
                  ({result.total} total)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <Button asChild>
          <Link href="/employee/chat">
            <MessageCircleQuestion className="w-4 h-4 mr-2" />
            Ask a New Question
          </Link>
        </Button>
      </div>

      {/* Clarifications List */}
      {clarifications.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircleQuestion className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No clarification requests yet
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            When you ask HR for clarification from the chat, they'll appear here.
          </p>
          <Button asChild>
            <Link href="/employee/chat">Start a Conversation</Link>
          </Button>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {clarifications.map((clarification) => (
              <Card key={clarification.id} className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(clarification.status)}
                      <span className="text-xs text-gray-500">
                        {formatDate(clarification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Question */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Your Question:</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {clarification.question}
                    </p>
                  </div>
                </div>

                {/* AI Answer (if provided) */}
                {clarification.aiAnswer && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">AI Response:</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {clarification.aiAnswer}
                      </p>
                    </div>
                  </div>
                )}

                {/* HR Response */}
                {clarification.status === 'RESOLVED' && clarification.hrResponse ? (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      HR Response:
                    </h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {clarification.hrResponse}
                      </p>
                      {clarification.resolvedAt && (
                        <p className="text-xs text-green-600 mt-2">
                          Responded on {formatDate(clarification.resolvedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {clarification.status === 'IN_REVIEW'
                        ? 'HR is reviewing your question...'
                        : clarification.status === 'DISMISSED'
                        ? 'This request was dismissed.'
                        : 'Waiting for HR to review...'}
                    </p>
                  </div>
                )}

                {/* Assigned To (if any) */}
                {clarification.assignedToName && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">
                      Assigned to: {clarification.assignedToName}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => loadClarifications(result.page + 1, true)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load More (${result.total - clarifications.length} remaining)`
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Info Box */}
      <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <MessageCircleQuestion className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              How Clarification Requests Work
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click "Not Helpful" on any AI response in chat</li>
              <li>• Click "Ask HR" to send your question to the HR team</li>
              <li>• HR will review and provide a personalized response</li>
              <li>• You'll see all your requests and responses here</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
