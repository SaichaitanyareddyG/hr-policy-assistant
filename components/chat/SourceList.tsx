/**
 * Source List Component
 * 
 * Displays source citations for AI assistant responses
 */

'use client';

import { Card } from '@/components/ui/card';
import { FileText, BookOpen } from 'lucide-react';

interface Source {
  documentTitle: string;
  sectionTitle?: string | null;
  pageNumber?: number | null;
}

interface SourceListProps {
  sources: Source[];
  confidence: 'High' | 'Medium' | 'Low';
}

export function SourceList({ sources, confidence }: SourceListProps) {
  if (sources.length === 0) {
    return null;
  }

  const confidenceColor = {
    High: 'text-green-600 bg-green-50 border-green-200',
    Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    Low: 'text-orange-600 bg-orange-50 border-orange-200',
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Sources:</span>
        <span
          className={`text-xs px-2 py-0.5 rounded border ${confidenceColor[confidence]}`}
        >
          {confidence} Confidence
        </span>
      </div>

      <div className="space-y-1.5">
        {sources.map((source, index) => (
          <Card key={index} className="p-2.5 bg-gray-50 border-gray-200">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {source.documentTitle}
                </p>
                {source.sectionTitle && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <BookOpen className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-600">{source.sectionTitle}</p>
                  </div>
                )}
                {source.pageNumber && (
                  <p className="text-xs text-gray-500 mt-0.5">Page {source.pageNumber}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
