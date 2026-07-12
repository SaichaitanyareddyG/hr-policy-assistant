/**
 * Embedding Status Badge Component
 * 
 * Visual indicator showing the embedding status of a document
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, Minus } from 'lucide-react';
import type { ProcessingStatus } from '@/types/documents';

interface EmbeddingStatusBadgeProps {
  embeddedChunks: number;
  totalChunks: number;
  processingStatus: ProcessingStatus;
}

export function EmbeddingStatusBadge({
  embeddedChunks,
  totalChunks,
  processingStatus,
}: EmbeddingStatusBadgeProps) {
  // If document not processed yet
  if (processingStatus !== 'COMPLETED') {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
        <Minus className="w-3 h-3 mr-1" />
        N/A
      </Badge>
    );
  }

  // If no chunks exist
  if (totalChunks === 0) {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
        <Minus className="w-3 h-3 mr-1" />
        No Chunks
      </Badge>
    );
  }

  // Calculate percentage
  const percentage = Math.round((embeddedChunks / totalChunks) * 100);

  // Fully embedded
  if (embeddedChunks === totalChunks) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {embeddedChunks}/{totalChunks}
      </Badge>
    );
  }

  // Partially embedded
  if (embeddedChunks > 0) {
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        {embeddedChunks}/{totalChunks}
      </Badge>
    );
  }

  // No embeddings
  return (
    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
      <AlertCircle className="w-3 h-3 mr-1" />
      0/{totalChunks}
    </Badge>
  );
}
