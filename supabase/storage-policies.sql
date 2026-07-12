-- ============================================
-- Storage Bucket RLS Policies
-- ============================================
-- Run this AFTER creating the policy-documents bucket
-- These policies control who can upload, read, and delete files

-- ============================================
-- POLICY 1: Upload Documents (Admins Only)
-- ============================================

CREATE POLICY "Admins can upload policy documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'policy-documents'
  AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN')
  )
);

-- ============================================
-- POLICY 2: Read Documents (Same Organization)
-- ============================================

CREATE POLICY "Users can read their organization documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'policy-documents'
  AND
  EXISTS (
    SELECT 1 FROM profiles AS user_profile
    WHERE user_profile.id = auth.uid()
    AND
    -- Check if document belongs to user's organization
    -- Path format: org_id/document_id/filename.pdf
    (storage.foldername(name))[1] = user_profile.org_id::text
  )
);

-- ============================================
-- POLICY 3: Delete Documents (Admins Only)
-- ============================================

CREATE POLICY "Admins can delete policy documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'policy-documents'
  AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN')
  )
);

-- ============================================
-- POLICY 4: Update/Move Files (Admins Only)
-- ============================================

CREATE POLICY "Admins can update policy documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'policy-documents'
  AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('ORG_ADMIN', 'DEPARTMENT_ADMIN')
  )
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%policy documents%';

-- Expected: 4 policies
-- 1. Admins can upload policy documents (INSERT)
-- 2. Users can read their organization documents (SELECT)
-- 3. Admins can delete policy documents (DELETE)
-- 4. Admins can update policy documents (UPDATE)

-- ============================================
-- NOTES
-- ============================================
-- 
-- Security Features:
-- 1. Only authenticated users can access
-- 2. Only admins can upload/delete/update
-- 3. Users can only read files from their org
-- 4. Path-based organization isolation
-- 
-- File Path Format:
-- {org_id}/{document_id}/{filename}.pdf
-- 
-- Example:
-- abc123-org/xyz789-doc/employee-handbook.pdf
-- 
-- The policy checks:
-- - (storage.foldername(name))[1] = org_id
-- - This extracts the first folder (org_id) from path
-- - Ensures users only see their org's files
