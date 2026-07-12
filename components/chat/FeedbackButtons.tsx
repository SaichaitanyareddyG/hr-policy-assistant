/**
 * Feedback Buttons Component
 * 
 * Allows employees to rate assistant responses as helpful or not helpful
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, Loader2, Check } from 'lucide-react';
import { submitMessageFeedback } from '@/lib/chat/feedback-actions';

interface FeedbackButtonsProps {
  messageId: string;
  onFeedbackSubmitted?: (feedback: 'HELPFUL' | 'NOT_HELPFUL') => void;
}

export function FeedbackButtons({ messageId, onFeedbackSubmitted }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'HELPFUL' | 'NOT_HELPFUL' | null>(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (type: 'HELPFUL' | 'NOT_HELPFUL') => {
    if (submitted) return;

    setFeedback(type);

    if (type === 'HELPFUL') {
      // Submit immediately for helpful
      setIsSubmitting(true);
      const result = await submitMessageFeedback({
        messageId,
        feedback: 'HELPFUL',
      });

      setIsSubmitting(false);

      if (result.success) {
        setSubmitted(true);
        onFeedbackSubmitted?.('HELPFUL');
      }
    } else {
      // Show comment box for not helpful
      setShowCommentBox(true);
    }
  };

  const handleSubmitNotHelpful = async () => {
    setIsSubmitting(true);

    const result = await submitMessageFeedback({
      messageId,
      feedback: 'NOT_HELPFUL',
      comment: comment.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmitted(true);
      onFeedbackSubmitted?.('NOT_HELPFUL');
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="w-4 h-4" />
        <span>Thank you for your feedback!</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Was this helpful?</span>
        <div className="flex gap-1">
          <Button
            variant={feedback === 'HELPFUL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFeedback('HELPFUL')}
            disabled={isSubmitting || showCommentBox}
          >
            {isSubmitting && feedback === 'HELPFUL' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ThumbsUp className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant={feedback === 'NOT_HELPFUL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFeedback('NOT_HELPFUL')}
            disabled={isSubmitting || showCommentBox}
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showCommentBox && (
        <div className="space-y-2">
          <Textarea
            placeholder="What could be improved? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="text-sm"
            rows={3}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmitNotHelpful} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowCommentBox(false);
                setFeedback(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
