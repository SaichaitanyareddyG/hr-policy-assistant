/**
 * Source Usage Table Component
 * 
 * Shows which policy documents are most frequently cited
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
import { SourceUsage } from '@/lib/analytics/queries';
import { FileText } from 'lucide-react';

interface SourceUsageTableProps {
  sources: SourceUsage[];
}

export function SourceUsageTable({ sources }: SourceUsageTableProps) {
  if (sources.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No source usage data yet
      </div>
    );
  }

  const maxCitations = sources[0]?.citationCount || 1;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Document</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right w-32">Citations</TableHead>
          <TableHead className="w-48">Usage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sources.map((source, index) => {
          const usagePercent = (source.citationCount / maxCitations) * 100;
          
          return (
            <TableRow key={index}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{source.documentTitle}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{source.category}</Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {source.citationCount}
              </TableCell>
              <TableCell>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
