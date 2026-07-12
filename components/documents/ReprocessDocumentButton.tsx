/**
 * Reprocess Document Button Component
 * 
 * Triggers reprocessing of a policy document (text extraction and chunking).
 * Shows loading state and handles success/error feedback.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { reprocessPolicyDocument } from '@/lib/processing/process-document';
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

interface ReprocessDocumentButtonProps {
  documentId: string;
  documentTitle: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
}

export function ReprocessDocumentButton({
  documentId,
  documentTitle,
  variant = 'outline',
  size = 'default',
  showIcon = true,
}: ReprocessDocumentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const router = useRouter();

  const handleReprocess = async () => {
    setIsProcessing(true);
    setMessage(null);

    try {
      const result = await reprocessPolicyDocument(documentId);

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message,
        });

        // Refresh the page after a short delay
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setMessage({
          type: 'error',
          text: result.message || result.error || 'Reprocessing failed',
        });
      }
    } catch (error) {
      console.error('Error reprocessing document:', error);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant={variant} size={size} disabled={isProcessing}>
            {showIcon && (
              <RefreshCw
                className={`w-4 h-4 ${size === 'icon' ? '' : 'mr-2'} ${
                  isProcessing ? 'animate-spin' : ''
                }`}
              />
            )}
            {size !== 'icon' && (isProcessing ? 'Reprocessing...' : 'Reprocess')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reprocess Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will re-extract text from the PDF and recreate all chunks for{' '}
              <strong>&quot;{documentTitle}&quot;</strong>.
              <br />
              <br />
              Existing chunks will be deleted and replaced. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReprocess}>Reprocess</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success/Error message */}
      {message && (
        <div
          className={`flex items-center gap-2 text-sm p-3 rounded border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
