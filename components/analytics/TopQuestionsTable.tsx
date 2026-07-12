/**
 * Top Questions Table Component
 * 
 * Displays the most frequently asked questions
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TopQuestion } from '@/lib/analytics/queries';
import { formatDistanceToNow } from '@/lib/utils/date';

interface TopQuestionsTableProps {
  questions: TopQuestion[];
}

export function TopQuestionsTable({ questions }: TopQuestionsTableProps) {
  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No questions asked yet
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Question</TableHead>
          <TableHead className="text-right w-32">Times Asked</TableHead>
          <TableHead className="text-right w-40">Last Asked</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {questions.map((question, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell className="font-medium">{question.question}</TableCell>
            <TableCell className="text-right">{question.questionCount}</TableCell>
            <TableCell className="text-right text-sm text-gray-500">
              {formatDistanceToNow(new Date(question.lastAsked))} ago
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
