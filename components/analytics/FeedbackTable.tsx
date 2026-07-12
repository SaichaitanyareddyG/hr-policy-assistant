/**
 * Feedback Table Component
 * 
 * Displays not helpful feedback with employee comments
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { NotHelpfulFeedback } from '@/lib/analytics/queries';
import { formatDistanceToNow } from '@/lib/utils/date';
import { MessageCircleQuestion } from 'lucide-react';

interface FeedbackTableProps {
  feedback: NotHelpfulFeedback[];
}

export function FeedbackTable({ feedback }: FeedbackTableProps) {
  if (feedback.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No negative feedback yet
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Question & Answer</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead>Comment</TableHead>
          <TableHead className="text-right w-40">Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {feedback.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="space-y-2 max-w-md">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Question:</p>
                  <p className="text-sm font-medium line-clamp-2">{item.question}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">AI Answer:</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{item.answer}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="align-top">
              <p className="text-sm font-medium">{item.employeeName}</p>
            </TableCell>
            <TableCell className="align-top">
              {item.comment ? (
                <p className="text-sm text-gray-600">{item.comment}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">No comment</p>
              )}
            </TableCell>
            <TableCell className="text-right text-sm text-gray-500 align-top">
              {formatDistanceToNow(new Date(item.createdAt))} ago
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
