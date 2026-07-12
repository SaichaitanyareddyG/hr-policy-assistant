/**
 * Main Document Processing Orchestrator
 * 
 * Coordinates the complete document processing pipeline:
 * 1. Download PDF from storage
 * 2. Extract text from PDF
 * 3. Clean extracted text
 * 4. Chunk text into segments
 * 5. Store chunks in database
 * 6. Update document processing status
 * 
 * Security:
 * - Only HR_ADMIN can trigger processing
 * - Document must belong to user's organization
 * - Handles errors gracefully with detailed logging
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ProfileData, PolicyDocumentData, DocumentUpdatePayload, ChunkInsertPayload, DocumentChunkData, EmbeddingUpdatePayload } from '@/types/database';
import { extractTextFromPolicyPdf } from './pdf';
import { cleanExtractedText, isTextQualityGood } from './text-cleaner';
import { chunkPolicyText, getChunkStatistics } from './chunker';
import { generateEmbedding, prepareChunkForEmbedding, getEmbeddingModelInfo } from '@/lib/ai/embeddings';

export interface ProcessingResult {
  success: boolean;
  status: 'COMPLETED' | 'FAILED' | 'NEEDS_OCR';
  message: string;
  extractedTextLength?: number;
  chunksCount?: number;
  error?: string;
}

/**
 * Process a policy document: extract text, chunk, and store
 * 
 * @param documentId - UUID of the policy document
 * @returns Processing result
 */
export async function processPolicyDocument(
  documentId: string
): Promise<ProcessingResult> {
  const supabase = await createClient();

  try {
    // 0. Authentication and authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        status: 'FAILED',
        message: 'Unauthorized',
        error: 'User not authenticated',
      };
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single() as { data: Pick<ProfileData, 'role' | 'org_id'> | null; error: any };

    if (!profile || (profile.role !== 'ORG_ADMIN' && profile.role !== 'DEPARTMENT_ADMIN')) {
      return {
        success: false,
        status: 'FAILED',
        message: 'Unauthorized',
        error: 'Only Admins can process documents',
      };
    }

    // Get document and verify ownership
    const { data: document } = await supabase
      .from('policy_documents')
      .select('id, org_id, file_path, title')
      .eq('id', documentId)
      .eq('org_id', profile.org_id!)
      .single() as { data: Pick<PolicyDocumentData, 'id' | 'org_id' | 'file_path' | 'title'> | null; error: any };

    if (!document) {
      return {
        success: false,
        status: 'FAILED',
        message: 'Document not found',
        error: 'Document not found or access denied',
      };
    }

    // 1. Set status to PROCESSING
    const statusUpdate: DocumentUpdatePayload = {
      processing_status: 'PROCESSING',
      processing_error: null,
    };
    await (supabase as any)
      .from('policy_documents')
      .update(statusUpdate)
      .eq('id', documentId);

    console.log(`[Processing] Starting processing for document: ${document.title}`);

    // 2. Extract text from PDF
    console.log(`[Processing] Extracting text from PDF: ${document.file_path}`);
    const extractionResult = await extractTextFromPolicyPdf(document.file_path);

    if (!extractionResult.success) {
      // Handle extraction failure
      const status = extractionResult.needsOcr ? 'NEEDS_OCR' : 'FAILED';

      const failedUpdate: DocumentUpdatePayload = {
        processing_status: status,
        processing_error: extractionResult.error,
        extracted_text_length: extractionResult.textLength,
        chunks_count: 0,
        processed_at: new Date().toISOString(),
      };
      await (supabase as any)
        .from('policy_documents')
        .update(failedUpdate)
        .eq('id', documentId);

      return {
        success: false,
        status,
        message: extractionResult.error || 'Text extraction failed',
        error: extractionResult.error,
      };
    }

    // 3. Clean extracted text
    console.log(`[Processing] Cleaning extracted text (${extractionResult.textLength} chars)`);
    const cleanedText = cleanExtractedText(extractionResult.text);

    // Validate text quality
    if (!isTextQualityGood(cleanedText)) {
      const ocrUpdate: DocumentUpdatePayload = {
        processing_status: 'NEEDS_OCR',
        processing_error: 'Extracted text quality is too low. Document may be scanned.',
        extracted_text_length: cleanedText.length,
        chunks_count: 0,
        processed_at: new Date().toISOString(),
      };
      await (supabase as any)
        .from('policy_documents')
        .update(ocrUpdate)
        .eq('id', documentId);

      return {
        success: false,
        status: 'NEEDS_OCR',
        message: 'Text quality too low',
        error: 'Document may be scanned or image-based',
      };
    }

    // 4. Chunk text
    console.log(`[Processing] Chunking text into segments`);
    const chunks = chunkPolicyText(cleanedText);

    if (chunks.length === 0) {
      const noChunksUpdate: DocumentUpdatePayload = {
        processing_status: 'FAILED',
        processing_error: 'No chunks could be created from text',
        extracted_text_length: cleanedText.length,
        chunks_count: 0,
        processed_at: new Date().toISOString(),
      };
      await (supabase as any)
        .from('policy_documents')
        .update(noChunksUpdate)
        .eq('id', documentId);

      return {
        success: false,
        status: 'FAILED',
        message: 'Chunking failed',
        error: 'Could not create chunks from text',
      };
    }

    const chunkStats = getChunkStatistics(chunks);
    console.log(`[Processing] Created ${chunks.length} chunks (${chunkStats.totalTokens} tokens)`);

    // 5. Delete old chunks if reprocessing
    const { error: deleteError } = await supabase
      .from('policy_document_chunks')
      .delete()
      .eq('document_id', documentId);

    if (deleteError) {
      console.error('[Processing] Error deleting old chunks:', deleteError);
      // Continue anyway - insert might still work
    }

    // 6. Insert chunks into database
    console.log(`[Processing] Storing ${chunks.length} chunks in database`);
    const chunksToInsert: ChunkInsertPayload[] = chunks.map((chunk) => ({
      org_id: document.org_id,
      document_id: documentId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      page_number: chunk.pageNumber || null,
      section_title: chunk.sectionTitle || null,
      token_estimate: chunk.tokenEstimate,
    }));

    const { error: insertError } = await supabase
      .from('policy_document_chunks')
      .insert(chunksToInsert as any) as { error: any };

    if (insertError) {
      console.error('[Processing] Error inserting chunks:', insertError);

      const saveErrorUpdate: DocumentUpdatePayload = {
        processing_status: 'FAILED',
        processing_error: `Failed to save chunks: ${insertError.message}`,
        extracted_text_length: cleanedText.length,
        chunks_count: 0,
        processed_at: new Date().toISOString(),
      };
      await (supabase as any)
        .from('policy_documents')
        .update(saveErrorUpdate)
        .eq('id', documentId);

      return {
        success: false,
        status: 'FAILED',
        message: 'Failed to save chunks',
        error: insertError.message,
      };
    }

    // 7. Update document with success status
    const successUpdate: DocumentUpdatePayload = {
      processing_status: 'COMPLETED',
      processing_error: null,
      extracted_text_length: cleanedText.length,
      chunks_count: chunks.length,
      processed_at: new Date().toISOString(),
    };
    await (supabase as any)
      .from('policy_documents')
      .update(successUpdate)
      .eq('id', documentId);

    console.log(`[Processing] ✓ Successfully processed document: ${document.title}`);

    // 8. Generate embeddings for all chunks (NEW - Step 2.1)
    // This runs after success status is set, so failures won't affect processing status
    console.log(`[Processing] Generating embeddings for ${chunks.length} chunks...`);
    try {
      const embeddingResult = await generateDocumentEmbeddingsInternal(
        supabase,
        documentId,
        document.org_id
      );

      if (embeddingResult.success) {
        console.log(
          `[Processing] ✓ Successfully generated ${embeddingResult.embeddedCount} embeddings`
        );
      } else {
        console.warn(
          `[Processing] ⚠️ Embedding generation had issues: ${embeddingResult.embeddedCount}/${embeddingResult.totalChunks} succeeded`
        );
      }
    } catch (embeddingError) {
      // Log warning but don't fail the whole process
      console.warn('[Processing] ⚠️ Failed to generate embeddings:', embeddingError);
      console.warn('[Processing] Document processing completed, but embeddings can be generated later');
    }

    return {
      success: true,
      status: 'COMPLETED',
      message: `Successfully processed document into ${chunks.length} chunks`,
      extractedTextLength: cleanedText.length,
      chunksCount: chunks.length,
    };
  } catch (error) {
    console.error('[Processing] Unexpected error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Try to update document status
    try {
      const errorUpdate: DocumentUpdatePayload = {
        processing_status: 'FAILED',
        processing_error: `Unexpected error: ${errorMessage}`,
        processed_at: new Date().toISOString(),
      };
      await (supabase as any)
        .from('policy_documents')
        .update(errorUpdate)
        .eq('id', documentId);
    } catch (updateError) {
      console.error('[Processing] Could not update document status:', updateError);
    }

    return {
      success: false,
      status: 'FAILED',
      message: 'Processing failed unexpectedly',
      error: errorMessage,
    };
  }
}

/**
 * Reprocess a document (same as process, but explicitly for reprocessing)
 * 
 * @param documentId - UUID of the policy document
 * @returns Processing result
 */
export async function reprocessPolicyDocument(
  documentId: string
): Promise<ProcessingResult> {
  console.log(`[Reprocessing] Reprocessing document: ${documentId}`);
  return processPolicyDocument(documentId);
}

/**
 * Internal helper to generate embeddings for all chunks in a document
 * 
 * This is called internally during processing, so it doesn't re-authenticate.
 * If embedding generation fails, it logs a warning but doesn't fail the process.
 * 
 * @param supabase - Authenticated Supabase client
 * @param documentId - Document ID
 * @param orgId - Organization ID
 * @returns Result with statistics
 */
async function generateDocumentEmbeddingsInternal(
  supabase: any,
  documentId: string,
  orgId: string
): Promise<{ success: boolean; totalChunks: number; embeddedCount: number }> {
  try {
    // Fetch all chunks for the document
    const { data: chunks, error: fetchError } = await supabase
      .from('policy_document_chunks')
      .select('id, content, section_title')
      .eq('document_id', documentId)
      .eq('org_id', orgId)
      .order('chunk_index', { ascending: true });

    if (fetchError || !chunks || chunks.length === 0) {
      console.error('[Embeddings] Failed to fetch chunks:', fetchError);
      return { success: false, totalChunks: 0, embeddedCount: 0 };
    }

    const totalChunks = chunks.length;
    let embeddedCount = 0;
    const modelInfo = getEmbeddingModelInfo();

    console.log(`[Embeddings] Processing ${totalChunks} chunks...`);

    // Generate embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        // Prepare text for embedding
        const text = prepareChunkForEmbedding(chunk.content, chunk.section_title);

        // Generate embedding
        const embedding = await generateEmbedding(text);

        // Save to database
        const embeddingUpdate: EmbeddingUpdatePayload = {
          embedding: embedding,
          embedding_model: modelInfo.model,
          embedded_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from('policy_document_chunks')
          .update(embeddingUpdate)
          .eq('id', chunk.id);

        if (updateError) {
          console.error(`[Embeddings] Error saving embedding for chunk ${i + 1}:`, updateError);
        } else {
          embeddedCount++;
        }

        // Log progress every 10 chunks
        if ((i + 1) % 10 === 0 || i + 1 === totalChunks) {
          console.log(`[Embeddings] Progress: ${i + 1}/${totalChunks} chunks`);
        }
      } catch (error) {
        console.error(`[Embeddings] Error embedding chunk ${i + 1}:`, error);
        // Continue with next chunk
      }
    }

    const success = embeddedCount === totalChunks;
    console.log(
      `[Embeddings] ${success ? 'Completed' : 'Partial completion'}: ${embeddedCount}/${totalChunks} chunks embedded`
    );

    return { success, totalChunks, embeddedCount };
  } catch (error) {
    console.error('[Embeddings] Unexpected error:', error);
    return { success: false, totalChunks: 0, embeddedCount: 0 };
  }
}

/**
 * Get chunks for a document
 * 
 * @param documentId - UUID of the policy document
 * @returns Array of chunks
 */
export async function getDocumentChunks(documentId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single() as { data: Pick<ProfileData, 'role' | 'org_id'> | null; error: any };

  if (!profile) {
    return { data: null, error: 'Profile not found' };
  }

  // Get chunks with org check
  const { data: chunks, error } = await (supabase as any)
    .from('policy_document_chunks')
    .select('*')
    .eq('document_id', documentId)
    .eq('org_id', profile.org_id!)
    .order('chunk_index', { ascending: true }) as { data: DocumentChunkData[] | null; error: any };

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: chunks, error: null };
}
