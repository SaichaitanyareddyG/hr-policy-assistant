/**
 * Conversation History Management
 * 
 * Retrieves and formats conversation history for context-aware responses.
 * Implements sliding window approach (last N messages) for efficient token usage.
 */

'use server';

import { createClient } from '@/lib/supabase/server';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

/**
 * Retrieve recent conversation history for a chat session
 * 
 * @param sessionId - The chat session ID
 * @param limit - Maximum number of messages to retrieve (default: 10 = 5 turns)
 * @returns Array of recent messages in chronological order
 */
export async function getConversationHistory(
  sessionId: string,
  limit: number = 10
): Promise<ChatMessage[]> {
  try {
    const supabase = await createClient();

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[ConversationHistory] Error fetching messages:', error);
      return [];
    }

    const m = messages as any[];
    if (!m || m.length === 0) {
      return [];
    }

    // Reverse to get chronological order (oldest first)
    return m
      .reverse()
      .map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
      }));
  } catch (error) {
    console.error('[ConversationHistory] Unexpected error:', error);
    return [];
  }
}

/**
 * Format conversation history for LLM prompt
 * 
 * @param messages - Array of chat messages
 * @returns Formatted string for inclusion in prompt
 * Internal function - not exported
 */
function formatConversationHistory(messages: ChatMessage[]): string {
  if (messages.length === 0) {
    return 'This is the first message in this conversation.';
  }

  const formatted = messages
    .map((msg) => {
      const role = msg.role === 'user' ? 'EMPLOYEE' : 'ASSISTANT';
      return `${role}: ${msg.content}`;
    })
    .join('\n\n');

  return `PREVIOUS CONVERSATION:\n${formatted}\n\n`;
}

/**
 * Check if conversation history should be included
 * 
 * @param sessionId - The chat session ID
 * @returns Whether to include conversation history
 * Internal function - not exported
 */
function shouldIncludeHistory(sessionId: string | undefined): boolean {
  return !!sessionId;
}
