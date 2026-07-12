/**
 * Rate Limiting - Step 8 Security Hardening
 * 
 * Database-based rate limiting to prevent abuse.
 * Uses the rate_limits table created in the security migration.
 * 
 * SECURITY: Server-side only. Uses service role key.
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Service role client for rate limit operations (bypasses RLS)
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

// =====================================================
// RATE LIMIT ACTIONS
// =====================================================

export const RATE_LIMIT_ACTIONS = {
  CHAT_QUESTION: 'chat_question',
  SIGNED_URL: 'signed_url',
  UPLOAD_DOCUMENT: 'upload_document',
  GENERATE_EMBEDDINGS: 'generate_embeddings',
} as const;

// Rate limit thresholds per action
export const RATE_LIMIT_THRESHOLDS: Record<string, number> = {
  [RATE_LIMIT_ACTIONS.CHAT_QUESTION]: 20, // 20 questions per hour
  [RATE_LIMIT_ACTIONS.SIGNED_URL]: 30, // 30 signed URLs per hour
  [RATE_LIMIT_ACTIONS.UPLOAD_DOCUMENT]: 10, // 10 uploads per hour
  [RATE_LIMIT_ACTIONS.GENERATE_EMBEDDINGS]: 5, // 5 embedding generations per hour
};

// =====================================================
// RATE LIMIT FUNCTIONS
// =====================================================

/**
 * Check if user is within rate limit for an action
 * 
 * @param userId - User UUID
 * @param orgId - Organization UUID
 * @param action - Action being rate limited
 * @param maxRequests - Maximum requests per hour (optional, uses default if not provided)
 * @returns true if within limit, false if rate limit exceeded
 */
export async function checkRateLimit(
  userId: string,
  orgId: string,
  action: string,
  maxRequests?: number
): Promise<boolean> {
  try {
    // Get threshold for this action
    const threshold = maxRequests || RATE_LIMIT_THRESHOLDS[action] || 10;

    // Calculate current window start (rounded to hour)
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setMinutes(0, 0, 0);

    // Check if rate limit record exists for this window
    const { data: existingLimit, error: fetchError } = await supabaseAdmin
      .from('rate_limits')
      .select('id, count')
      .eq('user_id', userId)
      .eq('action', action)
      .eq('window_start', windowStart.toISOString())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('[RateLimit] Error fetching rate limit:', fetchError);
      // Allow request on error (fail open)
      return true;
    }

    if (existingLimit) {
      // Record exists - check count
      if (existingLimit.count >= threshold) {
        console.log(
          `[RateLimit] Rate limit exceeded for user ${userId}, action ${action}: ${existingLimit.count}/${threshold}`
        );
        return false;
      }

      // Increment count
      const { error: updateError } = await supabaseAdmin
        .from('rate_limits')
        .update({
          count: existingLimit.count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLimit.id);

      if (updateError) {
        console.error('[RateLimit] Error updating rate limit:', updateError);
        // Allow request on error
        return true;
      }

      return true;
    } else {
      // No record exists - create new one
      const { error: insertError } = await supabaseAdmin.from('rate_limits').insert({
        org_id: orgId,
        user_id: userId,
        action,
        count: 1,
        window_start: windowStart.toISOString(),
      });

      if (insertError) {
        console.error('[RateLimit] Error creating rate limit record:', insertError);
        // Allow request on error
        return true;
      }

      return true;
    }
  } catch (error) {
    console.error('[RateLimit] Unexpected error in checkRateLimit:', error);
    // Fail open - allow request
    return true;
  }
}

/**
 * Get current rate limit status for a user and action
 * 
 * @param userId - User UUID
 * @param action - Action to check
 * @returns Current count and limit, or null if no limit set
 */
export async function getRateLimitStatus(
  userId: string,
  action: string
): Promise<{ count: number; limit: number; remaining: number; resetAt: Date } | null> {
  try {
    const threshold = RATE_LIMIT_THRESHOLDS[action] || 10;

    // Calculate current window start
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setMinutes(0, 0, 0);

    // Calculate reset time (next hour)
    const resetAt = new Date(windowStart);
    resetAt.setHours(resetAt.getHours() + 1);

    // Fetch rate limit record
    const { data: limit, error } = await supabaseAdmin
      .from('rate_limits')
      .select('count')
      .eq('user_id', userId)
      .eq('action', action)
      .eq('window_start', windowStart.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[RateLimit] Error fetching status:', error);
      return null;
    }

    const count = limit?.count || 0;
    const remaining = Math.max(0, threshold - count);

    return {
      count,
      limit: threshold,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error('[RateLimit] Error getting rate limit status:', error);
    return null;
  }
}

/**
 * Reset rate limit for a user and action (admin only)
 * 
 * @param userId - User UUID
 * @param action - Action to reset
 * @returns true if reset successfully
 */
export async function resetRateLimit(userId: string, action: string): Promise<boolean> {
  try {
    const windowStart = new Date();
    windowStart.setMinutes(0, 0, 0);

    const { error } = await supabaseAdmin
      .from('rate_limits')
      .delete()
      .eq('user_id', userId)
      .eq('action', action)
      .eq('window_start', windowStart.toISOString());

    if (error) {
      console.error('[RateLimit] Error resetting rate limit:', error);
      return false;
    }

    console.log(`[RateLimit] Reset rate limit for user ${userId}, action ${action}`);
    return true;
  } catch (error) {
    console.error('[RateLimit] Error in resetRateLimit:', error);
    return false;
  }
}

/**
 * Clean up old rate limit records (older than 24 hours)
 * 
 * This should be run periodically (e.g., daily cron job).
 * 
 * @returns Number of records deleted
 */
export async function cleanupOldRateLimits(): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);

    const { data, error } = await supabaseAdmin
      .from('rate_limits')
      .delete()
      .lt('window_start', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('[RateLimit] Error cleaning up old rate limits:', error);
      return 0;
    }

    const deletedCount = data?.length || 0;
    console.log(`[RateLimit] Cleaned up ${deletedCount} old rate limit records`);
    return deletedCount;
  } catch (error) {
    console.error('[RateLimit] Error in cleanupOldRateLimits:', error);
    return 0;
  }
}

/**
 * Get all rate limits for a user (for debugging/admin panel)
 * 
 * @param userId - User UUID
 * @returns Array of rate limit records
 */
export async function getUserRateLimits(userId: string): Promise<any[]> {
  try {
    const { data: limits, error } = await supabaseAdmin
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .order('window_start', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[RateLimit] Error fetching user rate limits:', error);
      return [];
    }

    return limits || [];
  } catch (error) {
    console.error('[RateLimit] Error in getUserRateLimits:', error);
    return [];
  }
}

// =====================================================
// RATE LIMIT ERROR RESPONSE HELPER
// =====================================================

/**
 * Create a standardized rate limit error response
 * 
 * @param action - Action that was rate limited
 * @param resetAt - When the rate limit resets (optional)
 * @returns Error object
 */
export function createRateLimitError(action: string, resetAt?: Date) {
  const resetTime = resetAt ? resetAt.toISOString() : 'soon';
  
  return {
    error: 'Rate limit exceeded',
    message: `You have exceeded the rate limit for ${action}. Please try again later.`,
    code: 'RATE_LIMIT_EXCEEDED',
    action,
    resetAt: resetTime,
  };
}
