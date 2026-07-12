/**
 * Secure Storage - Step 8 Security Hardening
 * 
 * Secure signed URL generation for private policy documents.
 * All PDFs are stored in a PRIVATE bucket with no public access.
 * Signed URLs are only generated after server-side permission checks.
 * 
 * SECURITY: Server-side only. Uses service role key.
 */

'use server';

import { createClient } from '@supabase/supabase-js';
import {
  getCurrentUserProfile,
  getAccessibleDocument,
  logSecurityEvent,
  type UserProfile,
} from '@/lib/auth/permissions';
import { checkRateLimit } from '@/lib/auth/rate-limit';

// Service role client for storage operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Storage configuration
const STORAGE_BUCKET = 'policy-documents';
const SIGNED_URL_EXPIRY_SECONDS = 600; // 10 minutes

// =====================================================
// SIGNED URL GENERATION
// =====================================================

/**
 * Generate a secure signed URL for a policy document
 * 
 * Security checks:
 * 1. User must be authenticated
 * 2. User must belong to same organization as document
 * 3. Document must exist and be accessible to user
 * 4. Rate limit: max 30 signed URLs per hour
 * 5. URL expires after 10 minutes
 * 
 * @param documentId - UUID of the policy document
 * @returns Signed URL or null if unauthorized
 * @throws Error if rate limit exceeded or other errors
 */
export async function getSecurePolicyDocumentSignedUrl(
  documentId: string
): Promise<string | null> {
  try {
    // 1. Get current user profile
    const userProfile = await getCurrentUserProfile();

    if (!userProfile) {
      logSecurityEvent('signed_url_unauthorized', { documentId });
      return null;
    }

    // 2. Check rate limit: max 30 signed URLs per hour
    const rateLimitOk = await checkRateLimit(
      userProfile.id,
      userProfile.orgId,
      'signed_url',
      30 // max requests
    );

    if (!rateLimitOk) {
      logSecurityEvent('signed_url_rate_limit', {
        userId: userProfile.id,
        documentId,
      });
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // 3. Fetch document and check access permissions
    const document = await getAccessibleDocument(userProfile, documentId);

    if (!document) {
      logSecurityEvent('signed_url_document_not_accessible', {
        userId: userProfile.id,
        orgId: userProfile.orgId,
        documentId,
      });
      return null;
    }

    // 4. Fetch full document details to get file_path
    const { data: docData, error: docError } = await supabaseAdmin
      .from('policy_documents')
      .select('file_path, org_id')
      .eq('id', documentId)
      .single();

    if (docError || !docData) {
      logSecurityEvent('signed_url_document_not_found', { documentId });
      return null;
    }

    // 5. Double-check org_id matches
    if (docData.org_id !== userProfile.orgId) {
      logSecurityEvent('signed_url_org_mismatch', {
        userId: userProfile.id,
        userOrgId: userProfile.orgId,
        documentOrgId: docData.org_id,
        documentId,
      });
      return null;
    }

    // 6. Generate signed URL using service role (bypasses RLS)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(docData.file_path, SIGNED_URL_EXPIRY_SECONDS);

    if (signedUrlError || !signedUrlData) {
      logSecurityEvent('signed_url_generation_failed', {
        documentId,
        error: signedUrlError?.message,
      });
      throw new Error('Failed to generate signed URL');
    }

    logSecurityEvent('signed_url_generated', {
      userId: userProfile.id,
      orgId: userProfile.orgId,
      documentId,
      role: userProfile.role,
    });

    return signedUrlData.signedUrl;
  } catch (error) {
    console.error('[SecureStorage] Error generating signed URL:', error);
    throw error;
  }
}

/**
 * Generate a secure signed URL for PDF upload (HR_ADMIN only)
 * 
 * Returns a signed upload URL for a new PDF file.
 * The file path is scoped to the organization.
 * 
 * @param fileName - Original file name (will be sanitized)
 * @param orgId - Organization ID (for scoped path)
 * @returns Upload signed URL and file path
 * @throws Error if not authorized or rate limit exceeded
 */
export async function getSecureUploadSignedUrl(
  fileName: string,
  orgId: string
): Promise<{ signedUrl: string; filePath: string } | null> {
  try {
    // 1. Get current user profile
    const userProfile = await getCurrentUserProfile();

    if (!userProfile) {
      logSecurityEvent('upload_url_unauthorized');
      return null;
    }

    // 2. Must be Admin (ORG_ADMIN or DEPARTMENT_ADMIN)
    if (userProfile.role !== 'ORG_ADMIN' && userProfile.role !== 'DEPARTMENT_ADMIN') {
      logSecurityEvent('upload_url_not_admin', { userId: userProfile.id });
      return null;
    }

    // 3. Must be same org
    if (userProfile.orgId !== orgId) {
      logSecurityEvent('upload_url_org_mismatch', {
        userId: userProfile.id,
        userOrgId: userProfile.orgId,
        requestedOrgId: orgId,
      });
      return null;
    }

    // 4. Sanitize file name (prevent path traversal)
    const sanitizedFileName = sanitizeFileName(fileName);

    // 5. Create org-scoped file path
    const timestamp = Date.now();
    const filePath = `${orgId}/${timestamp}-${sanitizedFileName}`;

    // 6. Generate signed upload URL (1 hour expiry for uploads)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUploadUrl(filePath);

    if (signedUrlError || !signedUrlData) {
      logSecurityEvent('upload_url_generation_failed', {
        error: signedUrlError?.message,
      });
      throw new Error('Failed to generate upload signed URL');
    }

    logSecurityEvent('upload_url_generated', {
      userId: userProfile.id,
      orgId: userProfile.orgId,
      fileName: sanitizedFileName,
    });

    return {
      signedUrl: signedUrlData.signedUrl,
      filePath,
    };
  } catch (error) {
    console.error('[SecureStorage] Error generating upload signed URL:', error);
    throw error;
  }
}

// =====================================================
// STORAGE BUCKET CONFIGURATION HELPER
// =====================================================

/**
 * Verify that the storage bucket is configured as PRIVATE
 * 
 * This should be called during setup/deployment verification.
 * 
 * @returns true if bucket is private, false otherwise
 */
export async function verifyBucketIsPrivate(): Promise<boolean> {
  try {
    const { data: bucket, error } = await supabaseAdmin.storage.getBucket(STORAGE_BUCKET);

    if (error || !bucket) {
      console.error('[SecureStorage] Failed to get bucket info:', error);
      return false;
    }

    // Check if bucket is public
    const isPrivate = !bucket.public;

    if (!isPrivate) {
      console.error(
        `[SecureStorage] WARNING: Bucket "${STORAGE_BUCKET}" is PUBLIC! It should be PRIVATE.`
      );
    }

    return isPrivate;
  } catch (error) {
    console.error('[SecureStorage] Error verifying bucket:', error);
    return false;
  }
}

/**
 * Get bucket configuration info (for admin diagnostics)
 * 
 * @returns Bucket configuration or null
 */
export async function getBucketInfo(): Promise<any> {
  try {
    const { data: bucket, error } = await supabaseAdmin.storage.getBucket(STORAGE_BUCKET);

    if (error || !bucket) {
      return null;
    }

    return {
      name: bucket.name,
      isPublic: bucket.public,
      fileSizeLimit: bucket.file_size_limit,
      allowedMimeTypes: bucket.allowed_mime_types,
    };
  } catch (error) {
    console.error('[SecureStorage] Error getting bucket info:', error);
    return null;
  }
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Sanitize file name to prevent path traversal and other attacks
 * 
 * @param fileName - Original file name
 * @returns Sanitized file name
 */
function sanitizeFileName(fileName: string): string {
  // Remove any path separators
  let sanitized = fileName.replace(/[\/\\]/g, '');

  // Remove any non-alphanumeric except dots, dashes, underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limit length
  if (sanitized.length > 200) {
    const ext = sanitized.split('.').pop();
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = nameWithoutExt.substring(0, 190) + (ext ? `.${ext}` : '');
  }

  // Ensure it's not empty
  if (!sanitized || sanitized === '.') {
    sanitized = 'document.pdf';
  }

  return sanitized;
}

/**
 * Delete a document file from storage (HR_ADMIN only)
 * 
 * @param filePath - File path in storage
 * @param orgId - Organization ID (for verification)
 * @returns true if deleted, false otherwise
 */
export async function deleteDocumentFile(
  filePath: string,
  orgId: string
): Promise<boolean> {
  try {
    const userProfile = await getCurrentUserProfile();

    if (!userProfile || (userProfile.role !== 'ORG_ADMIN' && userProfile.role !== 'DEPARTMENT_ADMIN') || userProfile.orgId !== orgId) {
      logSecurityEvent('delete_file_unauthorized', { filePath, orgId });
      return false;
    }

    // Verify file path starts with org_id (prevent deletion of other org files)
    if (!filePath.startsWith(orgId + '/')) {
      logSecurityEvent('delete_file_invalid_path', { filePath, orgId });
      return false;
    }

    const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([filePath]);

    if (error) {
      console.error('[SecureStorage] Error deleting file:', error);
      return false;
    }

    logSecurityEvent('file_deleted', {
      userId: userProfile.id,
      orgId,
      filePath,
    });

    return true;
  } catch (error) {
    console.error('[SecureStorage] Error deleting file:', error);
    return false;
  }
}
