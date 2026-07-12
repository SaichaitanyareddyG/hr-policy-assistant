/**
 * Embedding Actions for HR Admins
 * 
 * Server actions to generate embeddings for policy document chunks.
 * Only HR_ADMIN users can trigger embedding generation.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ProfileData, DocumentChunkData, EmbeddingUpdatePayload } from '@/types/database';
import type { UserRole } from '@/types/user';
import {
  generateEmbedding,
  prepareChunkForEmbedding,
  getEmbeddingModelInfo,
} from '@/lib/ai/embeddings';
import { revalidatePath } from 'next/cache';

interface EmbedChunkResult {
  success: boolean;
  chunkId: string;
  error?: string;
}

interface EmbedDocumentResult {
  success: boolean;
  totalChunks: number;
  embeddedChunks: number;
  skippedChunks: number;
  errors: string[];
}

/**
 * Embed a single chunk
 * 
 * @param chunkId - Chunk ID
 * @param force - Force re-embedding even if already embedded
 * @returns Result with success status
 */
export async function embedChunk(
  chunkId: string,
  force: boolean = false
): Promise<EmbedChunkResult> {
  try {
    const supabase = await createClient();

    // 1. Authenticate and authorize
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        chunkId,
        error: 'Unauthorized - Please log in',
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single<{ role: UserRole; org_id: string }>();

    if (profileError) {
      console.error('[embedChunk] Profile fetch error:', profileError);
      return {
        success: false,
        chunkId,
        error: 'Failed to fetch user profile',
      };
    }

    if (!profile || (profile.role !== 'ORG_ADMIN' && profile.role !== 'DEPARTMENT_ADMIN')) {
      return {
        success: false,
        chunkId,
        error: 'Only Admins can generate embeddings',
      };
    }

    // 2. Fetch the chunk
    const { data: chunk, error: fetchError } = await supabase
      .from('policy_document_chunks')
      .select('id, content, section_title, embedding, org_id')
      .eq('id', chunkId)
      .single<{ id: string; content: string; section_title: string | null; embedding: any; org_id: string }>();

    if (fetchError) {
      console.error('[embedChunk] Chunk fetch error:', fetchError);
      return {
        success: false,
        chunkId,
        error: 'Failed to fetch chunk',
      };
    }

    if (!chunk) {
      return {
        success: false,
        chunkId,
        error: 'Chunk not found',
      };
    }

    // 3. Verify chunk belongs to admin's org
    if (chunk.org_id !== profile.org_id) {
      return {
        success: false,
        chunkId,
        error: 'Cannot embed chunks from other organizations',
      };
    }

    // 4. Skip if already embedded (unless force)
    if (chunk.embedding && !force) {
      return {
        success: true,
        chunkId,
        error: 'Already embedded (use force to re-embed)',
      };
    }

    // 5. Prepare text for embedding
    const text = prepareChunkForEmbedding(chunk.content, chunk.section_title);

    // 6. Generate embedding
    const embedding = await generateEmbedding(text);
    const modelInfo = getEmbeddingModelInfo();

    // 7. Save embedding to database
    const embeddingUpdate: EmbeddingUpdatePayload = {
      embedding: embedding,
      embedding_model: modelInfo.model,
      embedded_at: new Date().toISOString(),
    };

    const { error: updateError } = await (supabase as any)
      .from('policy_document_chunks')
      .update(embeddingUpdate)
      .eq('id', chunkId) as { error: any };

    if (updateError) {
      console.error('[Embed Chunk] Error saving embedding:', updateError);
      return {
        success: false,
        chunkId,
        error: 'Failed to save embedding',
      };
    }

    return {
      success: true,
      chunkId,
    };
  } catch (error) {
    console.error('[Embed Chunk] Error:', error);
    return {
      success: false,
      chunkId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate embeddings for all chunks in a document
 * 
 * @param documentId - Document ID
 * @param force - Force re-embedding even if already embedded
 * @returns Result with statistics
 */
export async function embedDocumentChunks(
  documentId: string,
  force: boolean = false
): Promise<EmbedDocumentResult> {
  try {
    const supabase = await createClient();

    // 1. Authenticate and authorize
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        totalChunks: 0,
        embeddedChunks: 0,
        skippedChunks: 0,
        errors: ['Unauthorized - Please log in'],
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single<{ role: UserRole; org_id: string }>();

    if (profileError) {
      console.error('[embedDocumentChunks] Profile fetch error:', profileError);
      return {
        success: false,
        totalChunks: 0,
        embeddedChunks: 0,
        skippedChunks: 0,
        errors: ['Failed to fetch user profile'],
      };
    }

    if (!profile || (profile.role !== 'ORG_ADMIN' && profile.role !== 'DEPARTMENT_ADMIN')) {
      return {
        success: false,
        totalChunks: 0,
        embeddedChunks: 0,
        skippedChunks: 0,
        errors: ['Only Admins can generate embeddings'],
      };
    }

    // 2. Verify document belongs to admin's org
    const { data: document, error: documentError } = await supabase
      .from('policy_documents')
      .select('id, org_id, title')
      .eq('id', documentId)
      .single<{ id: string; org_id: string; title: string }>();

    if (documentError) {
      console.error('[embedDocumentChunks] Document fetch error:', documentError);
      return {
        success: false,
        totalChunks: 0,
        embeddedChunks: 0,
        skippedChunks: 0,
        errors: ['Failed to fetch document'],
      };
    }

    if (!document || document.org_id !== profile.org_id) {
      return {
        success: false,
        totalChunks: 0,
        embeddedChunks: 0,
        skippedChunks: 0,
        errors: ['Document not found or access denied'],
      };
    }

    // 3. Fetch all chunks for the document
    let query = supabase
      .from('policy_document_chunks')
      .select('id, content, section_title, embedding')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true });

    const { data: chunks, error: fetchError } = await query as { data: any[] | null; error: any };

    if (fetchError || !chunks) {
      return {
        success: false,
        totalChunks: 0,
        embeddedChunks: 0,
        skippedChunks: 0,
        errors: ['Failed to fetch chunks'],
      };
    }

    const totalChunks = chunks.length;

    if (totalChunks === 0) {
      return {
        success: true,
        totalChunks: 0,
        embeddedChunks: 0,
        skippedChunks: 0,
        errors: ['No chunks found for this document'],
      };
    }

    // 4. Filter chunks to embed
    const chunksToEmbed = force ? chunks : chunks.filter((c) => !c.embedding);

    const skippedChunks = totalChunks - chunksToEmbed.length;

    console.log(
      `[Embed Document] Processing ${chunksToEmbed.length} chunks for document "${document.title}"`
    );

    // 5. Embed each chunk
    let embeddedCount = 0;
    const errors: string[] = [];
    const modelInfo = getEmbeddingModelInfo();

    for (let i = 0; i < chunksToEmbed.length; i++) {
      const chunk = chunksToEmbed[i];

      try {
        // Prepare text
        const text = prepareChunkForEmbedding(chunk.content, chunk.section_title);

        // Generate embedding
        const embedding = await generateEmbedding(text);

        // Save to database
        const embeddingUpdate: EmbeddingUpdatePayload = {
          embedding: embedding,
          embedding_model: modelInfo.model,
          embedded_at: new Date().toISOString(),
        };

        const { error: updateError } = await (supabase as any)
          .from('policy_document_chunks')
          .update(embeddingUpdate)
          .eq('id', chunk.id);

        if (updateError) {
          errors.push(`Chunk ${i + 1}: Failed to save embedding`);
          console.error('[Embed Document] Error saving embedding:', updateError);
        } else {
          embeddedCount++;
        }

        // Log progress
        if ((i + 1) % 10 === 0 || i + 1 === chunksToEmbed.length) {
          console.log(`[Embed Document] Progress: ${i + 1}/${chunksToEmbed.length} chunks`);
        }

        // Small delay to avoid rate limits (handled in generateEmbedding)
      } catch (error) {
        errors.push(
          `Chunk ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        console.error(`[Embed Document] Error embedding chunk ${i + 1}:`, error);
      }
    }

    // 6. Revalidate the document page
    revalidatePath(`/admin/documents/${documentId}`);

    return {
      success: errors.length === 0,
      totalChunks,
      embeddedChunks: embeddedCount,
      skippedChunks,
      errors,
    };
  } catch (error) {
    console.error('[Embed Document] Error:', error);
    return {
      success: false,
      totalChunks: 0,
      embeddedChunks: 0,
      skippedChunks: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Embed all missing chunks for an organization (admin only)
 * 
 * @param orgId - Organization ID
 * @returns Result with statistics
 */
export async function embedMissingChunksForOrg(orgId: string): Promise<EmbedDocumentResult> {
  try {
    const supabase = await createClient();

    // 1. Authenticate and authorize
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        totalChunks: 0,
        embeddedChunks: 0,
        skippedChunks: 0,
        errors: ['Unauthorized - Please log in'],
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single<{ role: UserRole; org_id: string }>();

    if (profileError) {
      console.error('[embedMissingChunksForOrg] Profile fetch error:', profileError);
      return {
        success: false,
        totalChunks: 0,
        embeddedChunks: 0,
        skippedChunks: 0,
        errors: ['Failed to fetch user profile'],
      };
    }

    if (!profile || (profile.role !== 'ORG_ADMIN' && profile.role !== 'DEPARTMENT_ADMIN') || profile.org_id !== orgId) {
      return {
        success: false,
        totalChunks: 0,
        embeddedChunks: 0,
        skippedChunks: 0,
        errors: ['Only Admins can generate embeddings for their organization'],
      };
    }

    // 2. Fetch all chunks without embeddings
    const { data: chunks, error: fetchError } = await supabase
      .from('policy_document_chunks')
      .select('id, content, section_title, document_id')
      .eq('org_id', orgId)
      .is('embedding', null)
      .order('created_at', { ascending: true })
      .limit(1000) as { data: any[] | null; error: any }; // Limit to avoid timeout

    if (fetchError || !chunks) {
      return {
        success: false,
        totalChunks: 0,
        embeddedChunks: 0,
        skippedChunks: 0,
        errors: ['Failed to fetch chunks'],
      };
    }

    const totalChunks = chunks.length;

    if (totalChunks === 0) {
      return {
        success: true,
        totalChunks: 0,
        embeddedChunks: 0,
        skippedChunks: 0,
        errors: [],
      };
    }

    console.log(`[Embed Org] Processing ${totalChunks} chunks for org ${orgId}`);

    // 3. Embed each chunk
    let embeddedCount = 0;
    const errors: string[] = [];
    const modelInfo = getEmbeddingModelInfo();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        // Prepare text
        const text = prepareChunkForEmbedding(chunk.content, chunk.section_title);

        // Generate embedding
        const embedding = await generateEmbedding(text);

        // Save to database
        const embeddingUpdate: EmbeddingUpdatePayload = {
          embedding: embedding,
          embedding_model: modelInfo.model,
          embedded_at: new Date().toISOString(),
        };

        const { error: updateError } = await (supabase as any)
          .from('policy_document_chunks')
          .update(embeddingUpdate)
          .eq('id', chunk.id);

        if (updateError) {
          errors.push(`Chunk ${chunk.id}: Failed to save`);
          console.error('[Embed Org] Error saving embedding:', updateError);
        } else {
          embeddedCount++;
        }

        // Log progress
        if ((i + 1) % 25 === 0 || i + 1 === totalChunks) {
          console.log(`[Embed Org] Progress: ${i + 1}/${totalChunks} chunks`);
        }
      } catch (error) {
        errors.push(`Chunk ${chunk.id}: ${error instanceof Error ? error.message : 'Error'}`);
        console.error(`[Embed Org] Error embedding chunk ${i + 1}:`, error);
        
        // If too many errors, stop
        if (errors.length > 10) {
          errors.push('Too many errors, stopping...');
          break;
        }
      }
    }

    return {
      success: errors.length === 0,
      totalChunks,
      embeddedChunks: embeddedCount,
      skippedChunks: 0,
      errors,
    };
  } catch (error) {
    console.error('[Embed Org] Error:', error);
    return {
      success: false,
      totalChunks: 0,
      embeddedChunks: 0,
      skippedChunks: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
