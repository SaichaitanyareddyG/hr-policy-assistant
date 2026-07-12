/**
 * Feedback Actions
 * 
 * Allows employees to provide feedback on AI assistant responses.
 * Tracks helpful/not helpful ratings and comments.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type FeedbackType = 'HELPFUL' | 'NOT_HELPFUL';

export interface MessageFeedback {
  id: string;
  messageId: string;
  userId: string;
  feedback: FeedbackType;
  comment: string | null;
  createdAt: string;
}

/**
 * Submit feedback for an assistant message
 */
export async function submitMessageFeedback(params: {
  messageId: string;
  feedback: FeedbackType;
  comment?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, org_id')
      .eq('id', user.id)
      .single();

    const p = profile as any;
    if (!profile || !p.org_id) {
      return { success: false, error: 'Profile not found' };
    }

    // Verify the message belongs to the user's org
    const { data: message } = await supabase
      .from('chat_messages')
      .select('id, org_id, role')
      .eq('id', params.messageId)
      .single();

    const m = message as any;
    if (!message || m.org_id !== p.org_id) {
      return { success: false, error: 'Message not found' };
    }

    if (m.role !== 'assistant') {
      return { success: false, error: 'Can only provide feedback on assistant messages' };
    }

    // Insert or update feedback
    const { error } = await supabase
      .from('question_feedback')
      .upsert(
        {
          message_id: params.messageId,
          user_id: user.id,
          org_id: p.org_id,
          feedback: params.feedback,
          comment: params.comment || null,
        } as any,
        {
          onConflict: 'message_id,user_id',
        }
      );

    if (error) {
      console.error('[Feedback] Error submitting feedback:', error);
      return { success: false, error: 'Failed to submit feedback' };
    }

    revalidatePath('/employee/chat');

    return { success: true };
  } catch (error) {
    console.error('[Feedback] Error:', error);
    return { success: false, error: 'An error occurred' };
  }
}

/**
 * Get feedback for a message (to check if user already provided feedback)
 */
export async function getMessageFeedback(
  messageId: string
): Promise<MessageFeedback | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('question_feedback')
      .select('*')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return null;
    }

    const d = data as any;
    return {
      id: d.id,
      messageId: d.message_id,
      userId: d.user_id,
      feedback: d.feedback as FeedbackType,
      comment: d.comment,
      createdAt: d.created_at,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Create Ask HR request from a not helpful message
 */
export async function createAskHRRequestFromMessage(
  messageId: string,
  additionalComment?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, org_id')
      .eq('id', user.id)
      .single();

    const p = profile as any;
    if (!profile || !p.org_id) {
      return { success: false, error: 'Profile not found' };
    }

    // Get the assistant message
    const { data: assistantMessage, error: messageError } = await supabase
      .from('chat_messages')
      .select('id, content, session_id, created_at, org_id')
      .eq('id', messageId)
      .single();

    if (messageError || !assistantMessage) {
      return { success: false, error: 'Message not found' };
    }

    const am = assistantMessage as any;
    if (am.org_id !== p.org_id) {
      return { success: false, error: 'Access denied' };
    }

    // Get the user question from the same session
    const { data: userMessage } = await supabase
      .from('chat_messages')
      .select('content')
      .eq('session_id', am.session_id)
      .eq('role', 'user')
      .lt('created_at', am.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const um = userMessage as any;
    const question = um?.content || 'Question not found';

    // Create clarification request
    const { data, error } = await supabase
      .from('hr_clarification_requests')
      .insert({
        org_id: p.org_id,
        employee_id: user.id,
        question: additionalComment
          ? `${question}\n\nAdditional comment: ${additionalComment}`
          : question,
        ai_answer: am.content,
        assistant_message_id: messageId,
        status: 'OPEN',
      } as any)
      .select('id')
      .single();

    const d = data as any;

    if (error) {
      console.error('[Feedback] Error creating clarification request:', error);
      return { success: false, error: 'Failed to create request' };
    }

    revalidatePath('/admin/clarifications');
    revalidatePath('/employee/clarifications');

    return { success: true, id: d.id };
  } catch (error) {
    console.error('[Feedback] Error:', error);
    return { success: false, error: 'An error occurred' };
  }
}
