/**
 * Chat Message Component
 * 
 * Displays individual chat messages (user or assistant)
 */

'use client';

import { Card } from '@/components/ui/card';
import { Bot, User } from 'lucide-react';
import { SourceList } from './SourceList';
import { FeedbackButtons } from './FeedbackButtons';
import { AskHRButton } from './AskHRButton';
import { useState } from 'react';

interface Source {
  documentTitle: string;
  sectionTitle?: string | null;
  pageNumber?: number | null;
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  messageId?: string;
  isUnanswered?: boolean;
  sources?: Source[];
  confidence?: 'High' | 'Medium' | 'Low';
  details?: string;
  nextStep?: string;
}

export function ChatMessage({
  role,
  content,
  messageId,
  isUnanswered = false,
  sources = [],
  confidence,
  details,
  nextStep,
}: ChatMessageProps) {
  const isUser = role === 'user';
  const [showAskHR, setShowAskHR] = useState(isUnanswered);
  const [feedbackGiven, setFeedbackGiven] = useState<'HELPFUL' | 'NOT_HELPFUL' | null>(null);

  const handleFeedbackSubmitted = (feedback: 'HELPFUL' | 'NOT_HELPFUL') => {
    setFeedbackGiven(feedback);
    if (feedback === 'NOT_HELPFUL') {
      setShowAskHR(true);
    }
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
        <Card
          className={`p-4 ${
            isUser
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="prose prose-sm max-w-none">
            <p className={`text-sm ${isUser ? 'text-white' : 'text-gray-900'} whitespace-pre-wrap`}>
              {content}
            </p>
          </div>

          {/* Assistant details */}
          {!isUser && details && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">{details}</p>
            </div>
          )}

          {/* Next step suggestion */}
          {!isUser && nextStep && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs font-medium text-blue-700">Next Step:</p>
              <p className="text-xs text-blue-600 mt-1">{nextStep}</p>
            </div>
          )}

          {/* Feedback and Ask HR buttons for assistant messages */}
          {!isUser && messageId && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              <FeedbackButtons
                messageId={messageId}
                onFeedbackSubmitted={handleFeedbackSubmitted}
              />

              {/* Show Ask HR button if unanswered or if marked as not helpful */}
              {showAskHR && (
                <div>
                  <AskHRButton messageId={messageId} />
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Sources (only for assistant messages) */}
        {!isUser && sources && confidence && (
          <SourceList sources={sources} confidence={confidence} />
        )}
      </div>
    </div>
  );
}

