/**
 * Clarification Table Component
 * 
 * Displays HR clarification requests with status and actions
 */

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClarificationRequest } from '@/lib/clarifications/actions';
import { formatDistanceToNow } from '@/lib/utils/date';
import { Eye } from 'lucide-react';
import { ClarificationDetail } from './ClarificationDetail';

interface ClarificationTableProps {
  requests: ClarificationRequest[];
  isAdmin?: boolean;
  onUpdate?: () => void;
}

function getStatusBadge(status: string) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    OPEN: 'destructive',
    IN_REVIEW: 'default',
    RESOLVED: 'secondary',
    DISMISSED: 'outline',
  };

  return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
}

export function ClarificationTable({ requests, isAdmin = false, onUpdate }: ClarificationTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<ClarificationRequest | null>(null);

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No clarification requests
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            {isAdmin && <TableHead>Employee</TableHead>}
            <TableHead>Status</TableHead>
            {isAdmin && <TableHead>Assigned To</TableHead>}
            <TableHead className="text-right w-40">Date</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <p className="font-medium line-clamp-2">{request.question}</p>
                {request.aiAnswer && (
                  <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                    AI: {request.aiAnswer}
                  </p>
                )}
              </TableCell>
              {isAdmin && (
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{request.employeeName}</p>
                    <p className="text-xs text-gray-500">{request.employeeEmail}</p>
                  </div>
                </TableCell>
              )}
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              {isAdmin && (
                <TableCell>
                  {request.assignedToName ? (
                    <p className="text-sm">{request.assignedToName}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Unassigned</p>
                  )}
                </TableCell>
              )}
              <TableCell className="text-right text-sm text-gray-500">
                {formatDistanceToNow(new Date(request.createdAt))} ago
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRequest(request)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedRequest && (
        <ClarificationDetail
          request={selectedRequest}
          isAdmin={isAdmin}
          onClose={() => setSelectedRequest(null)}
          onUpdate={() => {
            setSelectedRequest(null);
            onUpdate?.();
          }}
        />
      )}
    </>
  );
}
