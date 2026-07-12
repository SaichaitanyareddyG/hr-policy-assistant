/**
 * Clarification Detail Component
 * 
 * Shows full details of a clarification request and allows HR to respond
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClarificationRequest, resolveClarificationRequest, updateClarificationStatus } from '@/lib/clarifications/actions';
import { format } from '@/lib/utils/date';
import { Loader2, CheckCircle } from 'lucide-react';

interface ClarificationDetailProps {
  request: ClarificationRequest;
  isAdmin?: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ClarificationDetail({
  request,
  isAdmin = false,
  onClose,
  onUpdate,
}: ClarificationDetailProps) {
  const [hrResponse, setHrResponse] = useState(request.hrResponse || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState(request.status);

  const handleResolve = async () => {
    if (!hrResponse.trim()) {
      return;
    }

    setIsSubmitting(true);
    const result = await resolveClarificationRequest(request.id, hrResponse);
    setIsSubmitting(false);

    if (result.success) {
      onUpdate();
    }
  };

  const handleStatusChange = async (status: string) => {
    setIsSubmitting(true);
    const result = await updateClarificationStatus(
      request.id,
      status as 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED'
    );
    setIsSubmitting(false);

    if (result.success) {
      setNewStatus(status as any);
      onUpdate();
    }
  };

  const isResolved = request.status === 'RESOLVED';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Clarification Request</span>
            <Badge>{request.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            From {request.employeeName} •{' '}
            {format(new Date(request.createdAt), 'PPp')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Question */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Employee Question:</h4>
            <div className="p-3 rounded bg-gray-50 text-sm">
              {request.question}
            </div>
          </div>

          {/* AI Answer */}
          {request.aiAnswer && (
            <div>
              <h4 className="text-sm font-semibold mb-2">AI Answer:</h4>
              <div className="p-3 rounded bg-blue-50 text-sm">
                {request.aiAnswer}
              </div>
            </div>
          )}

          <Separator />

          {/* HR Response Section */}
          {isAdmin && !isResolved ? (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold mb-2">Your Response:</h4>
                <Textarea
                  placeholder="Provide clarification or answer to the employee..."
                  value={hrResponse}
                  onChange={(e) => setHrResponse(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleResolve}
                  disabled={!hrResponse.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resolving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolve & Send
                    </>
                  )}
                </Button>

                <Select value={newStatus} onValueChange={handleStatusChange} disabled={isSubmitting}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="DISMISSED">Dismiss</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : isResolved && request.hrResponse ? (
            <div>
              <h4 className="text-sm font-semibold mb-2">HR Response:</h4>
              <div className="p-3 rounded bg-green-50 text-sm border border-green-200">
                {request.hrResponse}
              </div>
              {request.assignedToName && (
                <p className="text-xs text-gray-500 mt-2">
                  Resolved by {request.assignedToName} •{' '}
                  {request.resolvedAt && format(new Date(request.resolvedAt), 'PPp')}
                </p>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
