// Document types for PolicyPal AI

export type DocumentStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type AudienceType = 'ALL' | 'CUSTOM';
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'NEEDS_OCR';

export type PolicyCategory =
  | 'Leave Policy'
  | 'Reimbursement Policy'
  | 'Travel Policy'
  | 'Work From Home Policy'
  | 'Insurance Policy'
  | 'Wellness Policy'
  | 'Code of Conduct'
  | 'Onboarding'
  | 'Exit Policy'
  | 'Other';

export const POLICY_CATEGORIES: PolicyCategory[] = [
  'Leave Policy',
  'Reimbursement Policy',
  'Travel Policy',
  'Work From Home Policy',
  'Insurance Policy',
  'Wellness Policy',
  'Code of Conduct',
  'Onboarding',
  'Exit Policy',
  'Other',
];

export interface PolicyDocument {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  category: PolicyCategory;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  status: DocumentStatus;
  version: string | null;
  effective_date: string | null;
  audience_type: AudienceType;
  allowed_departments: string[] | null;
  allowed_locations: string[] | null;
  allowed_employment_types: string[] | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  // Processing fields (Step 3)
  processing_status: ProcessingStatus;
  processing_error: string | null;
  extracted_text_length: number | null;
  chunks_count: number | null;
  processed_at: string | null;
}

export interface PolicyDocumentWithUploader extends PolicyDocument {
  uploader_name?: string;
  uploader_email?: string;
  embedded_chunks?: number;
  total_chunks?: number;
  has_embeddings?: boolean;
}

export interface CreatePolicyDocumentInput {
  title: string;
  description?: string;
  category: PolicyCategory;
  version?: string;
  effective_date?: string;
  audience_type: AudienceType;
  allowed_departments?: string[];
  allowed_locations?: string[];
  allowed_employment_types?: string[];
  file: File;
}

export interface UpdatePolicyDocumentInput {
  id: string;
  title?: string;
  description?: string;
  category?: PolicyCategory;
  version?: string;
  effective_date?: string;
  audience_type?: AudienceType;
  allowed_departments?: string[];
  allowed_locations?: string[];
  allowed_employment_types?: string[];
  status?: DocumentStatus;
}

export interface DocumentFilters {
  category?: PolicyCategory | 'all';
  status?: DocumentStatus | 'all';
  search?: string;
}

// Processing types (Step 3)

export interface PolicyDocumentChunk {
  id: string;
  org_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  page_number: number | null;
  section_title: string | null;
  token_estimate: number | null;
  created_at: string;
}

export interface ProcessingResult {
  success: boolean;
  status: ProcessingStatus;
  message: string;
  extractedTextLength?: number;
  chunksCount?: number;
  error?: string;
}

export interface DocumentUploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
}
