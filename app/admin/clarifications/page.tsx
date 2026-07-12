/**
 * Admin Clarifications Page
 * 
 * Allows HR admins to view and respond to employee clarification requests
 */

'use client';

import { useState, useEffect } from 'react';
import { getClarificationRequestsPaginated, ClarificationRequestsResult } from '@/lib/clarifications/actions';
import { ClarificationTable } from '@/components/clarifications/ClarificationTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircleQuestion, Clock, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';

type TabValue = 'open' | 'in-review' | 'resolved' | 'all';

export default function ClarificationsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [result, setResult] = useState<ClarificationRequestsResult>({
    requests: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [summaries, setSummaries] = useState({
    open: 0,
    inReview: 0,
    resolved: 0,
    dismissed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load summary counts (without pagination)
  const loadSummaries = async () => {
    const [openRes, inReviewRes, resolvedRes, dismissedRes, totalRes] = await Promise.all([
      getClarificationRequestsPaginated({ status: 'OPEN', pageSize: 1 }),
      getClarificationRequestsPaginated({ status: 'IN_REVIEW', pageSize: 1 }),
      getClarificationRequestsPaginated({ status: 'RESOLVED', pageSize: 1 }),
      getClarificationRequestsPaginated({ status: 'DISMISSED', pageSize: 1 }),
      getClarificationRequestsPaginated({ pageSize: 1 }),
    ]);

    setSummaries({
      open: openRes.total,
      inReview: inReviewRes.total,
      resolved: resolvedRes.total,
      dismissed: dismissedRes.total,
      total: totalRes.total,
    });
  };

  // Load requests for current tab
  const loadRequests = async (page: number = 1) => {
    setLoading(true);

    const filters: any = {
      page,
      pageSize: 20,
    };

    if (activeTab !== 'all') {
      const statusMap: Record<string, string> = {
        'open': 'OPEN',
        'in-review': 'IN_REVIEW',
        'resolved': 'RESOLVED',
      };
      filters.status = statusMap[activeTab];
    }

    if (debouncedSearch.trim()) {
      filters.searchQuery = debouncedSearch.trim();
    }

    const data = await getClarificationRequestsPaginated(filters);
    setResult(data);
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    loadSummaries();
  }, []);

  // Reload when tab, page, or search changes
  useEffect(() => {
    loadRequests(1);
  }, [activeTab, debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    loadRequests(newPage);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
  };

  if (loading && result.requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Clarification Requests</h1>
        <p className="text-gray-500 mt-1">
          Employee questions that need HR attention
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <MessageCircleQuestion className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaries.open}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaries.inReview}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaries.resolved}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageCircleQuestion className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaries.total}</div>
            <p className="text-xs text-muted-foreground">All requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by question or response..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Requests Table with Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">
            Open <Badge className="ml-2">{summaries.open}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in-review">
            In Review <Badge className="ml-2">{summaries.inReview}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved <Badge className="ml-2">{summaries.resolved}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all">
            All <Badge className="ml-2">{summaries.total}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Content for all tabs */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'open' && 'Open Requests'}
              {activeTab === 'in-review' && 'In Review'}
              {activeTab === 'resolved' && 'Resolved Requests'}
              {activeTab === 'all' && 'All Requests'}
            </CardTitle>
            <CardDescription>
              {result.total > 0 ? (
                <>
                  Showing {(result.page - 1) * result.pageSize + 1}-
                  {Math.min(result.page * result.pageSize, result.total)} of {result.total} requests
                  {debouncedSearch && ' (filtered)'}
                </>
              ) : debouncedSearch ? (
                'No requests match your search'
              ) : (
                'No requests found'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : (
              <>
                <ClarificationTable
                  requests={result.requests}
                  isAdmin={true}
                  onUpdate={() => {
                    loadRequests(result.page);
                    loadSummaries();
                  }}
                />

                {/* Pagination Controls */}
                {result.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Page {result.page} of {result.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(result.page - 1)}
                        disabled={result.page === 1 || loading}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(result.page + 1)}
                        disabled={result.page === result.totalPages || loading}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
