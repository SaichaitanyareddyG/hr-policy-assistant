/**
 * Policy Chat Component
 * 
 * Main chat interface for employee policy questions
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Loader2, AlertCircle, Plus } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ExamplePrompts } from './ExamplePrompts';
import { getLatestChatSession } from '@/lib/chat/history-actions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  messageId?: string;
  isUnanswered?: boolean;
  sources?: Array<{
    documentTitle: string;
    sectionTitle?: string | null;
    pageNumber?: number | null;
  }>;
  confidence?: 'High' | 'Medium' | 'Low';
  details?: string;
  nextStep?: string;
}

export function PolicyChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input after history is loaded
  useEffect(() => {
    if (!isLoadingHistory) {
      textareaRef.current?.focus();
    }
  }, [isLoadingHistory]);

  const loadChatHistory = async () => {
    try {
      const latestSession = await getLatestChatSession();

      if (latestSession && latestSession.messages.length > 0) {
        // Load session and messages
        setSessionId(latestSession.id);
        setMessages(
          latestSession.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            messageId: msg.id,
            sources: msg.sources || [],
          }))
        );
      }
    } catch (error) {
      console.error('[PolicyChat] Error loading history:', error);
      // Don't show error to user - just start with empty chat
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      if (confirm('Start a new conversation? Your current chat will be saved.')) {
        setMessages([]);
        setSessionId(null);
        setError(null);
        textareaRef.current?.focus();
      }
    }
  };

  const handleSend = async () => {
    const question = input.trim();
    
    if (!question || isLoading) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      // Save session ID for future messages
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      // Add assistant message
      const assistantMessage: Message = {
        messageId: data.messageId,
        isUnanswered: data.isUnanswered || false,
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        confidence: data.confidence,
        details: data.details,
        nextStep: data.nextStep,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('[PolicyChat] Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');

      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your question.',
        details: 'Please try again or contact HR for assistance.',
        confidence: 'Low',
        sources: [],
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExampleClick = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Loading history state */}
        {isLoadingHistory ? (
          <div className="max-w-2xl mx-auto flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm text-gray-600">Loading your chat history...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          // Empty state with examples
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Hi! I'm PolicyPal AI
              </h2>
              <p className="text-gray-600">
                Ask me anything about your company's HR policies. I'll search through your
                policy documents and provide accurate answers.
              </p>
            </div>

            <ExamplePrompts onSelectPrompt={handleExampleClick} />
          </div>
        ) : (
          // Message list
          <div className="max-w-4xl mx-auto space-y-6">
            {/* New Chat button when messages exist */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </div>

            {messages.map((message, index) => (
              <ChatMessage key={index} {...message} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
                <Card className="p-4 bg-white border-gray-200">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Searching policy documents...</span>
                  </div>
                </Card>
              </div>
            )}

            {/* Error message */}
            {error && (
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about HR policies..."
              className="flex-1 min-h-[60px] max-h-[200px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="lg"
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
