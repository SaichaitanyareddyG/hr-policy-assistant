/**
 * Generate Embeddings Button Component
 * 
 * Allows HR admins to generate embeddings for document chunks
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { embedDocumentChunks } from '@/lib/documents/embedding-actions';
import { useRouter } from 'next/navigation';

interface GenerateEmbeddingsButtonProps {
  documentId: string;
  documentTitle: string;
  hasEmbeddings: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function GenerateEmbeddingsButton({
  documentId,
  documentTitle,
  hasEmbeddings,
  variant = 'default',
  size = 'default',
}: GenerateEmbeddingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    embeddedCount?: number;
    totalCount?: number;
  } | null>(null);
  
  const router = useRouter();

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await embedDocumentChunks(documentId, hasEmbeddings);

      if (response.success) {
        setResult({
          success: true,
          message: `Successfully embedded ${response.embeddedChunks} chunks${
            response.skippedChunks > 0 ? ` (${response.skippedChunks} already embedded)` : ''
          }`,
          embeddedCount: response.embeddedChunks,
          totalCount: response.totalChunks,
        });

        // Refresh the page data
        router.refresh();
      } else {
        setResult({
          success: false,
          message: `Failed: ${response.errors.join(', ')}`,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {hasEmbeddings ? 'Regenerate Embeddings' : 'Generate Embeddings'}
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasEmbeddings ? 'Regenerate Embeddings?' : 'Generate Embeddings?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {result ? (
              // Show result
              <div className="space-y-2">
                <div
                  className={`flex items-start gap-2 p-3 rounded ${
                    result.success ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">{result.success ? 'Success!' : 'Error'}</p>
                    <p className="text-sm mt-1">{result.message}</p>
                  </div>
                </div>
              </div>
            ) : (
              // Show confirmation message
              <div className="space-y-3">
                <p>
                  This will generate vector embeddings for all chunks in{' '}
                  <span className="font-semibold">{documentTitle}</span>.
                </p>
                {hasEmbeddings ? (
                  <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                    This document already has embeddings. Regenerating will overwrite them with
                    new embeddings.
                  </p>
                ) : (
                  <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                    Embeddings enable semantic search, allowing employees to find relevant
                    policies even without exact keyword matches.
                  </p>
                )}
                <p className="text-sm">
                  This process may take a few minutes depending on the number of chunks.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {result ? (
            <AlertDialogAction onClick={handleClose}>Close</AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate'
                )}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
