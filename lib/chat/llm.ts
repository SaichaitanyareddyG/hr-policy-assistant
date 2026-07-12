/**
 * Gemini LLM Integration for PolicyPal AI
 * 
 * Handles communication with Google's Gemini API to generate policy answers.
 * Server-side only - API key must never be exposed to browser.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT, buildUserPrompt, validateLLMResponse, type PromptContext } from './prompt';

// Initialize Gemini client (server-side only)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use Gemini 1.5 Flash for fast, cost-effective responses
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

export interface LLMResponse {
  answer: string;
  details?: string;
  confidence: 'High' | 'Medium' | 'Low';
  sources: Array<{
    documentTitle: string;
    sectionTitle?: string | null;
    pageNumber?: number | null;
  }>;
  nextStep?: string;
}

/**
 * Generate an answer using Gemini LLM
 * 
 * @param context - The prompt context with question, employee profile, and policy chunks
 * @returns Structured LLM response with answer and sources
 */
export async function generateAnswer(context: PromptContext): Promise<LLMResponse> {
  try {
    // Build the prompt
    const userPrompt = buildUserPrompt(context);

    // Create chat with system instruction
    const chat = model.startChat({
      generationConfig: {
        temperature: 0.3, // Low temperature for more factual responses
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 1024,
      },
      systemInstruction: SYSTEM_PROMPT,
    });

    console.log('[LLM] Sending request to Gemini...');

    // Send message and get response
    const result = await chat.sendMessage(userPrompt);
    const response = result.response;
    const text = response.text();

    console.log('[LLM] Received response from Gemini');

    // Parse JSON response
    let parsedResponse: any;
    try {
      // Extract JSON from response (handle markdown code blocks if present)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('[LLM] Failed to parse JSON response:', text);
      throw new Error('Invalid JSON response from LLM');
    }

    // Validate response structure
    if (!validateLLMResponse(parsedResponse)) {
      console.error('[LLM] Invalid response structure:', parsedResponse);
      throw new Error('LLM response does not match expected format');
    }

    // Return typed response
    return {
      answer: parsedResponse.answer,
      details: parsedResponse.details,
      confidence: parsedResponse.confidence,
      sources: parsedResponse.sources || [],
      nextStep: parsedResponse.nextStep,
    };
  } catch (error) {
    console.error('[LLM] Error generating answer:', error);

    // Return error response
    return {
      answer: 'I apologize, but I encountered an error while processing your question.',
      details: 'Please try again or contact HR directly for assistance.',
      confidence: 'Low',
      sources: [],
      nextStep: 'Try rephrasing your question, or contact your HR department.',
    };
  }
}

/**
 * Test LLM connection
 */
export async function testLLMConnection(): Promise<boolean> {
  try {
    const chat = model.startChat({
      generationConfig: {
        maxOutputTokens: 50,
      },
    });

    const result = await chat.sendMessage('Respond with just the word "OK"');
    const response = result.response.text();

    return response.toLowerCase().includes('ok');
  } catch (error) {
    console.error('[LLM] Connection test failed:', error);
    return false;
  }
}

/**
 * Validate API key is configured
 */
export function isLLMConfigured(): boolean {
  return !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 0);
}
