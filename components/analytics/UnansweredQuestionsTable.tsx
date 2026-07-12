/**
 * Unanswered Questions Table Component
 * 
 * Displays questions where AI could not find an answer
 */

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
import { UnansweredQuestion } from '@/lib/analytics/queries';
import { formatDistanceToNow } from '@/lib/utils/date';
import { ExternalLink } from 'lucide-react';

interface UnansweredQuestionsTableProps {
  questions: UnansweredQuestion[];
}

export function UnansweredQuestionsTable({ questions }: UnansweredQuestionsTableProps) {
  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No unanswered questions
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Question</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead className="text-right w-40">Date</TableHead>
          <TableHead className="w-24"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {questions.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="space-y-1">
                <p className="font-medium">{item.question}</p>
                {item.answer && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    AI response: {item.answer}
                  </p>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{item.employeeName}</p>
                <p className="text-xs text-gray-500">{item.employeeEmail}</p>
              </div>
            </TableCell>
            <TableCell className="text-right text-sm text-gray-500">
              {formatDistanceToNow(new Date(item.createdAt))} ago
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={`/admin/clarifications?messageId=${item.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
