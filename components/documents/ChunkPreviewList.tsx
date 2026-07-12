/**
 * Chunk Preview List Component
 * 
 * Displays a list of text chunks extracted from a policy document.
 * Shows chunk index, section title, and a preview of the content.
 */

'use client';

import { useState } from 'react';
import { PolicyDocumentChunk } from '@/types/documents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';

interface ChunkPreviewListProps {
  chunks: PolicyDocumentChunk[];
}

export function ChunkPreviewList({ chunks }: ChunkPreviewListProps) {
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());

  if (!chunks || chunks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No chunks available</p>
            <p className="text-sm mt-1">Process the document to extract chunks</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const toggleChunk = (index: number) => {
    const newExpanded = new Set(expandedChunks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChunks(newExpanded);
  };

  const expandAll = () => {
    setExpandedChunks(new Set(chunks.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedChunks(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            Document Chunks ({chunks.length})
          </h3>
          <p className="text-sm text-gray-500">
            Text segments for search and AI processing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Chunk list */}
      <div className="space-y-3">
        {chunks.map((chunk, index) => {
          const isExpanded = expandedChunks.has(index);
          const preview = chunk.content.substring(0, 200);

          return (
            <Card key={chunk.id} className="border">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        Chunk {chunk.chunk_index + 1}
                      </Badge>
                      {chunk.section_title && (
                        <span className="text-sm font-medium text-gray-700">
                          {chunk.section_title}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>{chunk.token_estimate} tokens</span>
                      <span>{chunk.content.length} characters</span>
                      {chunk.page_number && <span>Page {chunk.page_number}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleChunk(index)}
                    className="ml-2"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isExpanded ? (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border max-h-96 overflow-y-auto">
                    {chunk.content}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {preview}
                    {chunk.content.length > 200 && '...'}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
