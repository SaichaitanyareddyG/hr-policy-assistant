/**
 * Policy Document Retrieval for Chatbot
 * 
 * Retrieves relevant policy chunks for answering employee questions.
 * Step 5: Now uses semantic search with pgvector embeddings first,
 * then falls back to PostgreSQL full-text search and ILIKE search.
 * Step 8: Enhanced security - strict filtering, content trimming, no cross-org leaks.
 * Respects organization boundaries and audience visibility rules.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { searchChunksSemantic, SIMILARITY_THRESHOLDS } from '@/lib/ai/semantic-retrieval';

// SECURITY: Maximum chunk content length before trimming (prevent context injection)
const MAX_CHUNK_CONTENT_LENGTH = 2000; // ~500 tokens

export interface PolicyChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  content: string;
  sectionTitle: string | null;
  pageNumber: number | null;
  category: string;
}

export interface EmployeeProfile {
  id: string;
  orgId: string;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  role: string;
}

/**
 * Retrieve relevant policy chunks for a question
 * 
 * Step 5 Update: Now tries semantic search first, then falls back to keyword search
 * Step 8 Security: Strict filtering, content trimming, limit enforcement
 * 
 * SECURITY MEASURES:
 * - Always filters by org_id (no cross-org access)
 * - Only searches ACTIVE documents
 * - Only searches COMPLETED documents (no processing/failed)
 * - Enforces audience visibility rules
 * - Limits to max 5 chunks (prevent context stuffing)
 * - Trims chunk content to prevent injection
 * 
 * @param question - The employee's question
 * @param employeeProfile - Employee's profile for audience filtering
 * @param limit - Maximum number of chunks to return (default: 5, max: 5)
 * @returns Array of relevant policy chunks (content trimmed for security)
 */
export async function retrievePolicyChunks(
  question: string,
  employeeProfile: EmployeeProfile,
  limit: number = 5
): Promise<PolicyChunk[]> {
  // SECURITY: Enforce maximum limit
  const safeLimit = Math.min(limit, 5);

  // SECURITY: Log retrieval attempt (without sensitive data)
  console.log('[Retrieval:Security] Starting retrieval', {
    userId: employeeProfile.id,
    orgId: employeeProfile.orgId,
    role: employeeProfile.role,
    limit: safeLimit,
  });

  // Step 1: Try semantic search with embeddings
  try {
    console.log('[Retrieval] Attempting semantic search...');
    
    const semanticResults = await searchChunksSemantic(
      question,
      employeeProfile,
      safeLimit,
      SIMILARITY_THRESHOLDS.MEDIUM // Use medium threshold
    );

    if (semanticResults.length > 0) {
      console.log(`[Retrieval] Semantic search found ${semanticResults.length} results`);
      
      // SECURITY: Trim and sanitize chunk content
      const safeChunks = semanticResults.map(result => ({
        id: result.id,
        documentId: result.documentId,
        documentTitle: result.documentTitle,
        chunkIndex: result.chunkIndex,
        content: trimChunkContent(result.content),
        sectionTitle: result.sectionTitle,
        pageNumber: result.pageNumber,
        category: result.category,
      }));

      console.log('[Retrieval:Security] Returning sanitized semantic results');
      return safeChunks;
    }

    console.log('[Retrieval] Semantic search returned no results, falling back to keyword search');
  } catch (error) {
    console.log('[Retrieval] Semantic search failed, falling back to keyword search:', error);
  }

  // Step 2: Fall back to full-text search
  const supabase = await createClient();

  try {
    const chunks = await searchWithFullText(question, employeeProfile, safeLimit);
    if (chunks.length > 0) {
      console.log(`[Retrieval] Full-text search found ${chunks.length} results`);
      // SECURITY: Trim chunk content
      const safeChunks = chunks.map(chunk => ({
        ...chunk,
        content: trimChunkContent(chunk.content),
      }));
      return safeChunks;
    }
  } catch (error) {
    console.log('[Retrieval] Full-text search failed, falling back to ILIKE:', error);
  }

  // Step 3: Final fallback to simple ILIKE search
  console.log('[Retrieval] Using ILIKE fallback search');
  const iLikeChunks = await searchWithILike(question, employeeProfile, safeLimit);
  
  // SECURITY: Trim chunk content
  return iLikeChunks.map(chunk => ({
    ...chunk,
    content: trimChunkContent(chunk.content),
  }));
}

/**
 * Search using PostgreSQL full-text search
 */
async function searchWithFullText(
  question: string,
  employeeProfile: EmployeeProfile,
  limit: number
): Promise<PolicyChunk[]> {
  const supabase = await createClient();

  // Extract search terms from question
  const searchTerms = question
    .toLowerCase()
    .replace(/[?.,!]/g, '')
    .split(' ')
    .filter(term => term.length > 2)
    .join(' & ');

  if (!searchTerms) {
    return [];
  }

  // Build query with visibility rules
  let query = supabase
    .from('policy_document_chunks')
    .select(`
      id,
      document_id,
      chunk_index,
      content,
      section_title,
      page_number,
      policy_documents!inner (
        id,
        title,
        category,
        status,
        processing_status,
        audience_type,
        allowed_departments,
        allowed_locations,
        allowed_employment_types
      )
    `)
    .eq('org_id', employeeProfile.orgId)
    .eq('policy_documents.status', 'ACTIVE')
    .eq('policy_documents.processing_status', 'COMPLETED')
    .textSearch('content', searchTerms, {
      type: 'websearch',
      config: 'english'
    })
    .limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('[Retrieval] Full-text search error:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Filter by audience visibility
  const visibleChunks = data.filter(chunk => {
    const doc = (chunk as any).policy_documents;
    return isDocumentVisibleToEmployee(doc, employeeProfile);
  });

  // Transform to PolicyChunk format
  return visibleChunks.map(chunk => {
    const c = chunk as any;
    const doc = c.policy_documents;
    return {
      id: c.id,
      documentId: doc.id,
      documentTitle: doc.title,
      chunkIndex: c.chunk_index,
      content: c.content,
      sectionTitle: c.section_title,
      pageNumber: c.page_number,
      category: doc.category,
    };
  });
}

/**
 * Search using simple ILIKE pattern matching
 */
async function searchWithILike(
  question: string,
  employeeProfile: EmployeeProfile,
  limit: number
): Promise<PolicyChunk[]> {
  const supabase = await createClient();

  // Extract key terms from question
  const keyTerms = question
    .toLowerCase()
    .replace(/[?.,!]/g, '')
    .split(' ')
    .filter(term => term.length > 3); // Only words 4+ chars

  if (keyTerms.length === 0) {
    return [];
  }

  // Use the most important term (usually a noun/verb)
  // For better results, we'll search for the longest term
  const searchTerm = keyTerms.reduce((a, b) => a.length > b.length ? a : b);

  // Build query
  let query = supabase
    .from('policy_document_chunks')
    .select(`
      id,
      document_id,
      chunk_index,
      content,
      section_title,
      page_number,
      policy_documents!inner (
        id,
        title,
        category,
        status,
        processing_status,
        audience_type,
        allowed_departments,
        allowed_locations,
        allowed_employment_types
      )
    `)
    .eq('org_id', employeeProfile.orgId)
    .eq('policy_documents.status', 'ACTIVE')
    .eq('policy_documents.processing_status', 'COMPLETED')
    .ilike('content', `%${searchTerm}%`)
    .limit(limit * 2); // Get more, then filter and limit

  const { data, error } = await query;

  if (error) {
    console.error('[Retrieval] ILIKE search error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Filter by audience visibility
  const visibleChunks = data.filter(chunk => {
    const doc = (chunk as any).policy_documents;
    return isDocumentVisibleToEmployee(doc, employeeProfile);
  });

  // Score chunks by relevance (count matching terms)
  const scoredChunks = visibleChunks.map(chunk => {
    const c = chunk as any;
    const content = c.content.toLowerCase();
    const score = keyTerms.reduce((sum, term) => {
      return sum + (content.includes(term) ? 1 : 0);
    }, 0);
    return { chunk, score };
  });

  // Sort by score and take top results
  scoredChunks.sort((a, b) => b.score - a.score);
  const topChunks = scoredChunks.slice(0, limit);

  // Transform to PolicyChunk format
  return topChunks.map(({ chunk }) => {
    const c = chunk as any;
    const doc = c.policy_documents;
    return {
      id: c.id,
      documentId: doc.id,
      documentTitle: doc.title,
      chunkIndex: c.chunk_index,
      content: c.content,
      sectionTitle: c.section_title,
      pageNumber: c.page_number,
      category: doc.category,
    };
  });
}

/**
 * Check if a document is visible to an employee based on audience rules
 */
function isDocumentVisibleToEmployee(
  document: any,
  employee: EmployeeProfile
): boolean {
  // If audience is ALL, visible to everyone
  if (document.audience_type === 'ALL') {
    return true;
  }

  // If audience is CUSTOM, check filters
  if (document.audience_type === 'CUSTOM') {
    const { allowed_departments, allowed_locations, allowed_employment_types } = document;

    // If no filters set, assume visible
    const hasNoFilters =
      (!allowed_departments || allowed_departments.length === 0) &&
      (!allowed_locations || allowed_locations.length === 0) &&
      (!allowed_employment_types || allowed_employment_types.length === 0);

    if (hasNoFilters) {
      return true;
    }

    // Check if employee matches any filter (OR logic)
    const matchesDepartment =
      !allowed_departments ||
      allowed_departments.length === 0 ||
      (employee.department && allowed_departments.includes(employee.department));

    const matchesLocation =
      !allowed_locations ||
      allowed_locations.length === 0 ||
      (employee.location && allowed_locations.includes(employee.location));

    const matchesEmploymentType =
      !allowed_employment_types ||
      allowed_employment_types.length === 0 ||
      (employee.employmentType && allowed_employment_types.includes(employee.employmentType));

    // Employee must match at least one filter
    return matchesDepartment || matchesLocation || matchesEmploymentType;
  }

  return false;
}

/**
 * Get employee profile from Supabase
 */
export async function getEmployeeProfile(userId: string): Promise<EmployeeProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, org_id, department, location, employment_type, role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('[Retrieval] Error fetching employee profile:', error);
    return null;
  }

  const d = data as any;
  return {
    id: d.id,
    orgId: d.org_id!,
    department: d.department,
    location: d.location,
    employmentType: d.employment_type,
    role: d.role,
  };
}
// =====================================================
// SECURITY HELPERS
// =====================================================

/**
 * Trim chunk content to prevent context injection and reduce token usage
 * 
 * SECURITY: Limits chunk content length to prevent:
 * - Context stuffing attacks
 * - Excessive token usage
 * - Prompt injection via long chunks
 * 
 * @param content - Original chunk content
 * @returns Trimmed content (max 2000 chars)
 */
function trimChunkContent(content: string): string {
  if (!content) return '';
  
  if (content.length <= MAX_CHUNK_CONTENT_LENGTH) {
    return content;
  }

  // Trim to max length and add ellipsis
  const trimmed = content.substring(0, MAX_CHUNK_CONTENT_LENGTH);
  
  // Try to break at sentence boundary
  const lastPeriod = trimmed.lastIndexOf('.');
  const lastQuestion = trimmed.lastIndexOf('?');
  const lastExclamation = trimmed.lastIndexOf('!');
  const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclamation);

  if (lastSentence > MAX_CHUNK_CONTENT_LENGTH * 0.8) {
    // Break at sentence if it's within last 20%
    return trimmed.substring(0, lastSentence + 1) + ' [...]';
  }

  // Otherwise break at last space
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > 0) {
    return trimmed.substring(0, lastSpace) + ' [...]';
  }

  return trimmed + ' [...]';
}