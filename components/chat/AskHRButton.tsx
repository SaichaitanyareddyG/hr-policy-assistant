/**
 * Ask HR Button Component
 * 
 * Allows employees to request HR clarification when AI cannot answer
 * or when the answer is not helpful
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { MessageCircleQuestion, Loader2, Check } from 'lucide-react';
import { createAskHRRequestFromMessage } from '@/lib/chat/feedback-actions';

interface AskHRButtonProps {
  messageId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function AskHRButton({ messageId, variant = 'outline', size = 'sm' }: AskHRButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [additionalComment, setAdditionalComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const result = await createAskHRRequestFromMessage(
      messageId,
      additionalComment.trim() || undefined
    );

    setIsSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setAdditionalComment('');
    setSubmitted(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size}>
          <MessageCircleQuestion className="w-4 h-4 mr-2" />
          Ask HR
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {submitted ? 'Sent to HR' : 'Ask HR for Clarification'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {submitted ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 rounded bg-green-50 text-green-900">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Your question was sent to HR</p>
                    <p className="text-sm mt-1">
                      You'll be notified when HR provides a response.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p>
                  Your question will be forwarded to the HR team for clarification.
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Additional context (optional):
                  </label>
                  <Textarea
                    placeholder="Provide any additional context that might help HR answer your question..."
                    value={additionalComment}
                    onChange={(e) => setAdditionalComment(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {submitted ? (
            <AlertDialogAction onClick={handleClose}>Close</AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send to HR'
                )}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
