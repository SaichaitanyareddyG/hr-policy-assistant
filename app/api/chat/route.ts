/**
 * Chat API Route
 * 
 * Handles employee questions about HR policies.
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Validate question with guardrails (NEW)
 * 3. Rate limit check
 * 4. **Check approved FAQs first**
 * 5. If no FAQ match, retrieve conversation history (NEW)
 * 6. Retrieve relevant policy chunks (with permission filtering)
 * 7. Generate answer using LLM with conversation context (NEW)
 * 8. Save conversation to database
 * 9. Return answer with sources
 * 
 * Security (Step 8):
 * - Server-side only
 * - Authenticated users only
 * - Rate limiting (20 questions/hour)
 * - Organization-level isolation
 * - Audience visibility enforced
 * - Safe logging (no sensitive data)
 * 
 * Enhanced Features:
 * - Topic classification to prevent off-topic questions
 * - Conversation memory for context-aware responses
 * - Stronger guardrails against prompt injection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmployeeProfile, retrievePolicyChunks } from '@/lib/chat/retrieval';
import { generateAnswer, isLLMConfigured } from '@/lib/chat/llm';
import { createNoResultsResponse, createErrorResponse } from '@/lib/chat/prompt';
import { checkRateLimit, RATE_LIMIT_ACTIONS, createRateLimitError } from '@/lib/auth/rate-limit';
import { logSecurityEvent } from '@/lib/auth/permissions';
import { searchFAQs } from '@/lib/faq/actions';
import { logEmployeeQuestion, logAIAnswerGenerated } from '@/lib/audit/audit-logs';
import { validateQuestion, createOffTopicResponse } from '@/lib/chat/guardrails';
import { getConversationHistory } from '@/lib/chat/conversation-history';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // 1. Check LLM is configured
    if (!isLLMConfigured()) {
      return NextResponse.json(
        {
          error: 'AI service not configured. Please contact your administrator.',
        },
        { status: 500 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { question, sessionId } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Question is required',
        },
        { status: 400 }
      );
    }

    // SECURITY: Validate question length
    if (question.length > 1000) {
      return NextResponse.json(
        {
          error: 'Question too long. Please keep questions under 1000 characters.',
        },
        { status: 400 }
      );
    }

    // 2.5. GUARDRAILS: Validate question topic and detect malicious input
    console.log('[Chat API] Validating question with guardrails...');
    const validation = await validateQuestion(question.trim(), true);
    
    if (!validation.isValid) {
      console.log('[Chat API] Question failed validation:', validation.reason);
      
      // Return off-topic response
      const offTopicResponse = createOffTopicResponse(validation.reason);
      return NextResponse.json({
        answer: offTopicResponse.answer,
        details: offTopicResponse.details,
        confidence: offTopicResponse.confidence,
        sources: offTopicResponse.sources,
        nextStep: offTopicResponse.nextStep,
        isOffTopic: true,
      });
    }

    console.log('[Chat API] Question passed validation. Category:', validation.classification?.category);

    // 3. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized - Please log in',
        },
        { status: 401 }
      );
    }

    // 4. Get employee profile
    const employeeProfile = await getEmployeeProfile(user.id);

    if (!employeeProfile) {
      return NextResponse.json(
        {
          error: 'Employee profile not found',
        },
        { status: 404 }
      );
    }

    // 5. SECURITY: Rate limit check (20 questions per hour)
    const rateLimitOk = await checkRateLimit(
      user.id,
      employeeProfile.orgId,
      RATE_LIMIT_ACTIONS.CHAT_QUESTION
    );

    if (!rateLimitOk) {
      logSecurityEvent('chat_rate_limit_exceeded', {
        requestId,
        userId: user.id,
        orgId: employeeProfile.orgId,
      });

      return NextResponse.json(createRateLimitError('chat questions'), { status: 429 });
    }

    // SECURITY: Log request (sanitized - no question content)
    logSecurityEvent('chat_request', {
      requestId,
      userId: user.id,
      orgId: employeeProfile.orgId,
      role: employeeProfile.role,
      questionLength: question.length,
    });

    // Audit log
    await logEmployeeQuestion();

    // 6. CHECK APPROVED FAQs FIRST (NEW)
    const faqResult = await searchFAQs(question);
    
    if (faqResult.success && faqResult.faq) {
      // FAQ match found - return HR-approved answer immediately
      const faq = faqResult.faq;
      
      // Save to chat history with FAQ marker
      let activeSessionId = sessionId;

      if (!activeSessionId) {
        const { data: newSession } = await supabase
          .from('chat_sessions')
          .insert({
            org_id: employeeProfile.orgId,
            user_id: user.id,
            title: question.substring(0, 100),
          } as any)
          .select('id')
          .single();

        const ns = newSession as any;
        if (ns) {
          activeSessionId = ns.id;
        }
      }

      if (activeSessionId) {
        // Save user message
        await supabase.from('chat_messages').insert({
          session_id: activeSessionId,
          org_id: employeeProfile.orgId,
          user_id: user.id,
          role: 'user',
          content: question,
        } as any);

        // Save FAQ answer
        await supabase.from('chat_messages').insert({
          session_id: activeSessionId,
          org_id: employeeProfile.orgId,
          user_id: user.id,
          role: 'assistant',
          content: faq.answer,
          sources: [{
            documentId: faq.id,
            documentTitle: 'HR-Approved FAQ',
            chunkText: faq.question,
          }],
          confidence: 'High',
          is_unanswered: false,
        } as any);
      }

      const duration = Date.now() - startTime;

      return NextResponse.json({
        answer: faq.answer,
        confidence: 'High',
        sources: [{
          documentId: faq.id,
          documentTitle: 'HR-Approved FAQ',
          category: faq.category || 'General',
          chunkText: faq.question,
        }],
        sessionId: activeSessionId,
        isFromFAQ: true, // Flag to show "HR-approved answer" badge
        metadata: {
          requestId,
          duration,
          sourceCount: 1,
          faqCategory: faq.category,
        },
      });
    }

    // 7. No FAQ match - proceed with normal RAG retrieval
    const policyChunks = await retrievePolicyChunks(question, employeeProfile, 5);

    // SECURITY: Log retrieval results (no content)
    logSecurityEvent('chat_retrieval_complete', {
      requestId,
      userId: user.id,
      orgId: employeeProfile.orgId,
      chunksFound: policyChunks.length,
    });

    // 7.5. Retrieve conversation history for context-aware responses
    let conversationHistory: any[] = [];
    if (sessionId) {
      console.log('[Chat API] Retrieving conversation history for session:', sessionId);
      conversationHistory = await getConversationHistory(sessionId, 10); // Last 5 turns
      console.log('[Chat API] Retrieved', conversationHistory.length, 'previous messages');
    }

    // 8. Generate answer using LLM with conversation context
    let llmResponse;

    if (policyChunks.length === 0) {
      // No chunks found - return standard response
      llmResponse = createNoResultsResponse();
      
      logSecurityEvent('chat_no_results', {
        requestId,
        userId: user.id,
        orgId: employeeProfile.orgId,
      });
    } else {
      // Generate answer from chunks with conversation history
      llmResponse = await generateAnswer({
        question,
        employeeProfile,
        policyChunks,
        conversationHistory, // NEW: Pass conversation context
      });

      logSecurityEvent('chat_answer_generated', {
        requestId,
        userId: user.id,
        orgId: employeeProfile.orgId,
        chunksUsed: policyChunks.length,
      });
    }

    // 9. Create or get chat session
    let activeSessionId = sessionId;

    if (!activeSessionId) {
      // Create new session
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          org_id: employeeProfile.orgId,
          user_id: user.id,
          title: question.substring(0, 100), // Use first 100 chars of question as title
        } as any)
        .select('id')
        .single();

      if (sessionError || !newSession) {
        // SECURITY: Log error (no sensitive data)
        console.error('[Chat API] Error creating session:', sessionError?.message);
        // Continue without saving (return answer anyway)
      } else {
        const ns = newSession as any;
        activeSessionId = ns.id;
      }
    }

    // 9. Save messages to database
    let assistantMessageId: string | null = null;
    const isUnanswered = llmResponse.confidence === 'Low' && (!llmResponse.sources || llmResponse.sources.length === 0);

    if (activeSessionId) {
      try {
        // Save user message
        await supabase.from('chat_messages').insert({
          session_id: activeSessionId,
          org_id: employeeProfile.orgId,
          user_id: user.id,
          role: 'user',
          content: question,
        } as any);

        // Save assistant message
        const { data: assistantMessage } = await supabase
          .from('chat_messages')
          .insert({
            session_id: activeSessionId,
            org_id: employeeProfile.orgId,
            user_id: user.id,
            role: 'assistant',
            content: llmResponse.answer,
            sources: llmResponse.sources,
            confidence: llmResponse.confidence,
            is_unanswered: isUnanswered,
          } as any)
          .select('id')
          .single();

        const am = assistantMessage as any;
        if (am) {
          assistantMessageId = am.id;
        }
      } catch (saveError) {
        // SECURITY: Log error (no sensitive data)
        console.error('[Chat API] Error saving messages:', (saveError as Error).message);
        // Continue - return answer even if save failed
      }
    }

    // SECURITY: Log completion (sanitized)
    const duration = Date.now() - startTime;
    logSecurityEvent('chat_request_complete', {
      requestId,
      userId: user.id,
      orgId: employeeProfile.orgId,
      durationMs: duration,
      success: true,
    });

    // 10. Return response
    return NextResponse.json({
      answer: llmResponse.answer,
      details: llmResponse.details,
      confidence: llmResponse.confidence,
      sources: llmResponse.sources,
      nextStep: llmResponse.nextStep,
      sessionId: activeSessionId,
      messageId: assistantMessageId,
      isUnanswered,
    });
  } catch (error) {
    console.error('[Chat API] Unexpected error:', error);

    const errorResponse = createErrorResponse();

    return NextResponse.json(
      {
        answer: errorResponse.answer,
        details: errorResponse.details,
        confidence: errorResponse.confidence,
        sources: errorResponse.sources,
        nextStep: errorResponse.nextStep,
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
