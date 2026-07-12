-- =====================================================
-- STEP 3: PDF Text Extraction and Chunk Storage
-- =====================================================
-- This migration adds:
-- 1. Processing status columns to policy_documents
-- 2. policy_document_chunks table
-- 3. Indexes for performance
-- 4. RLS policies for chunks
-- =====================================================

-- =====================================================
-- 1. ADD PROCESSING COLUMNS TO policy_documents
-- =====================================================

ALTER TABLE policy_documents
ADD COLUMN processing_status text NOT NULL DEFAULT 'PENDING',
ADD COLUMN processing_error text,
ADD COLUMN extracted_text_length integer,
ADD COLUMN chunks_count integer,
ADD COLUMN processed_at timestamp with time zone;

-- Add check constraint for processing_status
ALTER TABLE policy_documents
ADD CONSTRAINT policy_documents_processing_status_check 
CHECK (processing_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'NEEDS_OCR'));

-- Add comment
COMMENT ON COLUMN policy_documents.processing_status IS 'Status of text extraction: PENDING, PROCESSING, COMPLETED, FAILED, NEEDS_OCR';
COMMENT ON COLUMN policy_documents.processing_error IS 'Error message if processing failed';
COMMENT ON COLUMN policy_documents.extracted_text_length IS 'Length of extracted text in characters';
COMMENT ON COLUMN policy_documents.chunks_count IS 'Number of chunks created from document';
COMMENT ON COLUMN policy_documents.processed_at IS 'Timestamp when processing completed';

-- =====================================================
-- 2. CREATE policy_document_chunks TABLE
-- =====================================================

CREATE TABLE policy_document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES policy_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  page_number integer,
  section_title text,
  token_estimate integer,
  created_at timestamp with time zone DEFAULT now(),
  
  -- Ensure unique chunk_index per document
  CONSTRAINT policy_document_chunks_unique_index UNIQUE (document_id, chunk_index)
);

-- Add comments
COMMENT ON TABLE policy_document_chunks IS 'Stores text chunks extracted from policy documents for search and AI processing';
COMMENT ON COLUMN policy_document_chunks.chunk_index IS 'Sequential index of chunk within document (0-based)';
COMMENT ON COLUMN policy_document_chunks.content IS 'Extracted text content of the chunk';
COMMENT ON COLUMN policy_document_chunks.page_number IS 'Source page number if available from PDF parser';
COMMENT ON COLUMN policy_document_chunks.section_title IS 'Section or heading title if detected';
COMMENT ON COLUMN policy_document_chunks.token_estimate IS 'Estimated token count for LLM context planning';

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

-- Index for org-level queries
CREATE INDEX idx_policy_document_chunks_org_id 
ON policy_document_chunks(org_id);

-- Index for document-level queries
CREATE INDEX idx_policy_document_chunks_document_id 
ON policy_document_chunks(document_id);

-- Composite index for chunk retrieval
CREATE INDEX idx_policy_document_chunks_doc_index 
ON policy_document_chunks(document_id, chunk_index);

-- Full-text search index on content
CREATE INDEX idx_policy_document_chunks_content_fts 
ON policy_document_chunks USING gin(to_tsvector('english', content));

-- Index on processing_status for filtering
CREATE INDEX idx_policy_documents_processing_status 
ON policy_documents(processing_status);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on policy_document_chunks
ALTER TABLE policy_document_chunks ENABLE ROW LEVEL SECURITY;

-- Policy 1: HR_ADMIN can read all chunks in their organization
CREATE POLICY "HR admins can read chunks in their organization"
ON policy_document_chunks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = policy_document_chunks.org_id
    AND profiles.role = 'HR_ADMIN'
  )
);

-- Policy 2: HR_ADMIN can insert chunks in their organization
CREATE POLICY "HR admins can insert chunks in their organization"
ON policy_document_chunks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = policy_document_chunks.org_id
    AND profiles.role = 'HR_ADMIN'
  )
);

-- Policy 3: HR_ADMIN can delete chunks in their organization
CREATE POLICY "HR admins can delete chunks in their organization"
ON policy_document_chunks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = policy_document_chunks.org_id
    AND profiles.role = 'HR_ADMIN'
  )
);

-- Policy 4: EMPLOYEES can read chunks for ACTIVE visible documents
-- Note: This uses simplified org-level RLS. Complex audience filtering
-- should be done in application code when needed for employee queries.
CREATE POLICY "Employees can read chunks for active documents in their org"
ON policy_document_chunks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = policy_document_chunks.org_id
    AND profiles.role = 'EMPLOYEE'
  )
  AND EXISTS (
    SELECT 1 FROM policy_documents
    WHERE policy_documents.id = policy_document_chunks.document_id
    AND policy_documents.status = 'ACTIVE'
    AND policy_documents.processing_status = 'COMPLETED'
  )
);

-- =====================================================
-- 5. HELPER FUNCTION (Optional but useful)
-- =====================================================

-- Function to get chunk count for a document
CREATE OR REPLACE FUNCTION get_document_chunk_count(doc_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM policy_document_chunks
  WHERE document_id = doc_id;
$$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'policy_documents' 
    AND column_name = 'processing_status'
  ) THEN
    RAISE EXCEPTION 'Migration failed: processing_status column not added';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'policy_document_chunks'
  ) THEN
    RAISE EXCEPTION 'Migration failed: policy_document_chunks table not created';
  END IF;
  
  RAISE NOTICE 'Step 3 migration completed successfully!';
END $$;
