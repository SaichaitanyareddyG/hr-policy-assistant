/**
 * Semantic Retrieval using pgvector
 * 
 * Performs similarity search on policy chunks using vector embeddings.
 * Falls back to keyword search if semantic search fails or returns no results.
 */

import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from './embeddings';
import type { PolicyChunk, EmployeeProfile } from '../chat/retrieval';

export interface SemanticSearchResult extends PolicyChunk {
  similarity: number;
}

// Similarity thresholds
export const SIMILARITY_THRESHOLDS = {
  HIGH: 0.78,
  MEDIUM: 0.68,
  LOW: 0.60, // Below this, we consider results too unreliable
};

/**
 * Perform semantic search for policy chunks
 * 
 * @param question - The employee's question
 * @param employeeProfile - Employee profile for filtering
 * @param limit - Maximum number of results (default: 5)
 * @param minSimilarity - Minimum similarity threshold (default: 0.68)
 * @returns Array of matching chunks with similarity scores
 */
export async function searchChunksSemantic(
  question: string,
  employeeProfile: EmployeeProfile,
  limit: number = 5,
  minSimilarity: number = SIMILARITY_THRESHOLDS.MEDIUM
): Promise<SemanticSearchResult[]> {
  try {
    console.log('[Semantic Search] Generating embedding for question...');

    // 1. Generate embedding for the question
    const queryEmbedding = await generateEmbedding(question);

    console.log('[Semantic Search] Embedding generated, searching database...');

    // 2. Call Supabase function to search
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('match_policy_chunks_semantic', {
      query_embedding: queryEmbedding,
      match_org_id: employeeProfile.orgId,
      match_department: employeeProfile.department,
      match_location: employeeProfile.location,
      match_employment_type: employeeProfile.employmentType,
      match_count: limit,
      similarity_threshold: minSimilarity,
    } as any);

    if (error) {
      console.error('[Semantic Search] Database error:', error);
      throw error;
    }

    const d = data as any;
    if (!d || d.length === 0) {
      console.log('[Semantic Search] No results found above threshold');
      return [];
    }

    console.log(`[Semantic Search] Found ${d.length} results`);

    // 3. Transform results to PolicyChunk format with similarity
    const results: SemanticSearchResult[] = d.map((row: any) => ({
      id: row.chunk_id,
      documentId: row.document_id,
      documentTitle: row.document_title,
      chunkIndex: 0, // Not returned by the function, but not critical
      content: row.content,
      sectionTitle: row.section_title,
      pageNumber: row.page_number,
      category: row.document_category,
      similarity: row.similarity,
    }));

    // Log similarity scores for debugging
    results.forEach((result, index) => {
      console.log(
        `[Semantic Search] Result ${index + 1}: similarity=${result.similarity.toFixed(3)}, doc="${result.documentTitle}"`
      );
    });

    return results;
  } catch (error) {
    console.error('[Semantic Search] Error:', error);
    throw error;
  }
}

/**
 * Get the confidence level based on similarity score
 * 
 * @param similarity - Similarity score (0-1)
 * @returns Confidence level
 */
export function getSimilarityConfidence(similarity: number): 'High' | 'Medium' | 'Low' {
  if (similarity >= SIMILARITY_THRESHOLDS.HIGH) {
    return 'High';
  } else if (similarity >= SIMILARITY_THRESHOLDS.MEDIUM) {
    return 'Medium';
  } else {
    return 'Low';
  }
}

/**
 * Check if semantic search results are good enough to use
 * 
 * @param results - Search results
 * @param minQuality - Minimum quality threshold (default: MEDIUM)
 * @returns True if results are usable
 */
export function areResultsUsable(
  results: SemanticSearchResult[],
  minQuality: number = SIMILARITY_THRESHOLDS.MEDIUM
): boolean {
  if (results.length === 0) {
    return false;
  }

  // Check if at least one result is above the threshold
  return results.some((result) => result.similarity >= minQuality);
}

/**
 * Get statistics about embedding coverage for an organization
 * 
 * @param orgId - Organization ID
 * @returns Embedding statistics
 */
export async function getEmbeddingStats(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('policy_document_chunks')
    .select('id, embedding')
    .eq('org_id', orgId);

  if (error || !data) {
    console.error('[Semantic Search] Error fetching embedding stats:', error);
    return {
      totalChunks: 0,
      embeddedChunks: 0,
      percentage: 0,
    };
  }

  const totalChunks = data.length;
  const d = data as any[];
  const embeddedChunks = d.filter((chunk) => chunk.embedding !== null).length;
  const percentage = totalChunks > 0 ? (embeddedChunks / totalChunks) * 100 : 0;

  return {
    totalChunks,
    embeddedChunks,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimals
  };
}

/**
 * Check if a document has embeddings for all its chunks
 * 
 * @param documentId - Document ID
 * @returns Embedding status
 */
export async function getDocumentEmbeddingStatus(documentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('count_embedded_chunks', {
    doc_id: documentId,
  } as any);

  const d = data as any;
  if (error || !d || d.length === 0) {
    console.error('[Semantic Search] Error fetching document embedding status:', error);
    return {
      totalChunks: 0,
      embeddedChunks: 0,
      percentage: 0,
      status: 'not_started' as const,
    };
  }

  const stats = d[0];
  const totalChunks = Number(stats.total_chunks);
  const embeddedChunks = Number(stats.embedded_chunks);
  const percentage = Number(stats.embedding_percentage);

  // Determine status
  let status: 'not_started' | 'partial' | 'completed';
  if (embeddedChunks === 0) {
    status = 'not_started';
  } else if (embeddedChunks < totalChunks) {
    status = 'partial';
  } else {
    status = 'completed';
  }

  return {
    totalChunks,
    embeddedChunks,
    percentage,
    status,
  };
}
