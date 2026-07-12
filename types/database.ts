/**
 * Database Type Definitions
 * 
 * Explicit TypeScript interfaces for database queries
 * to avoid Supabase generated type conflicts
 */

import type { UserRole } from './user';

/**
 * Profile data from database
 */
export interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  org_id: string | null;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Policy document data from database
 */
export interface PolicyDocumentData {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  category: string;
  version: string | null;
  effective_date: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  audience_type: 'ALL' | 'CUSTOM';
  allowed_departments: string[] | null;
  allowed_locations: string[] | null;
  allowed_employment_types: string[] | null;
  processing_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'NEEDS_OCR' | null;
  processing_error: string | null;
  extracted_text_length: number | null;
  chunks_count: number | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Document chunk data from database
 */
export interface DocumentChunkData {
  id: string;
  org_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  page_number: number | null;
  section_title: string | null;
  token_estimate: number;
  embedding: number[] | null;
  embedding_model: string | null;
  embedded_at: string | null;
  created_at: string;
}

/**
 * Supabase query result wrapper
 */
export interface SupabaseQueryResult<T> {
  data: T | null;
  error: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
}

/**
 * Document update payload
 */
export interface DocumentUpdatePayload {
  processing_status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'NEEDS_OCR';
  processing_error?: string | null;
  extracted_text_length?: number;
  chunks_count?: number;
  processed_at?: string;
  updated_at?: string;
}

/**
 * Chunk insert payload
 */
export interface ChunkInsertPayload {
  org_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  page_number: number | null;
  section_title: string | null;
  token_estimate: number;
}

/**
 * Embedding update payload
 */
export interface EmbeddingUpdatePayload {
  embedding: number[];
  embedding_model: string;
  embedded_at: string;
}
