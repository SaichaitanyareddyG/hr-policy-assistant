/**
 * Audit Logs Table Component
 * 
 * Displays audit logs with filtering and details.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AuditLog } from '@/lib/audit/audit-logs';
import {
  Activity,
  User,
  FileText,
  MessageSquare,
  Shield,
  Users,
  AlertTriangle,
  Eye,
  Search,
} from 'lucide-react';
import { format } from '@/lib/utils/date';

interface AuditLogsTableProps {
  logs: AuditLog[];
  userRole: string;
}

export function AuditLogsTable({ logs, userRole }: AuditLogsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = searchTerm
      ? log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resourceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.metadata).toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesFilter = filterAction === 'all' || log.action.includes(filterAction);

    return matchesSearch && matchesFilter;
  });

  const getActionIcon = (action: string) => {
    if (action.includes('user') || action.includes('invite')) return <Users className="w-4 h-4" />;
    if (action.includes('document')) return <FileText className="w-4 h-4" />;
    if (action.includes('organization')) return <Shield className="w-4 h-4" />;
    if (action.includes('question') || action.includes('answer')) return <MessageSquare className="w-4 h-4" />;
    if (action.includes('unauthorized') || action.includes('suspicious')) return <AlertTriangle className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (action.includes('created') || action.includes('accepted')) return 'default';
    if (action.includes('updated') || action.includes('generated')) return 'secondary';
    if (action.includes('deleted') || action.includes('revoked') || action.includes('unauthorized')) return 'destructive';
    return 'outline';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activity Log
        </CardTitle>
        <CardDescription>
          {userRole === 'ORG_ADMIN'
            ? 'All organization events are shown'
            : 'Limited to events relevant to your department'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search actions, resources, or metadata..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="user">User Actions</option>
            <option value="document">Document Actions</option>
            <option value="question">Chat Actions</option>
            <option value="faq">FAQ Actions</option>
            <option value="unauthorized">Security Events</option>
          </select>
        </div>

        {/* Logs List */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No audit logs found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      {getActionIcon(log.action)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                        {log.resourceType && (
                          <Badge variant="outline" className="text-xs">
                            {log.resourceType}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {log.actorUserId ? (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            User ID: {log.actorUserId.substring(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-gray-400">System action</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                  </p>
                </div>

                {/* Metadata */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-700 font-medium flex items-center gap-2">
                        <Eye className="w-3 h-3" />
                        View Details
                      </summary>
                      <pre className="mt-2 text-gray-600 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination note */}
        {filteredLogs.length >= 100 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing first 100 events. Pagination coming soon.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
