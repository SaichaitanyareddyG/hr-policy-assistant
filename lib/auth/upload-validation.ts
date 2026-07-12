/**
 * File Upload Validation - Step 8 Security Hardening
 * 
 * Validates file uploads to prevent security vulnerabilities.
 * All validations happen server-side.
 * 
 * SECURITY: Server-side only. HR_ADMIN only.
 */

'use server';

import { requireAdmin, getCurrentUserProfile } from '@/lib/auth/permissions';

// =====================================================
// VALIDATION CONFIGURATION
// =====================================================

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
] as const;

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.pdf'] as const;

// Maximum file size (10 MB)
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Maximum file name length
const MAX_FILE_NAME_LENGTH = 255;

// =====================================================
// VALIDATION TYPES
// =====================================================

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

export interface UploadValidation {
  file: File;
  expectedOrgId: string;
}

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Validate uploaded file before processing
 * 
 * Checks:
 * - User is HR_ADMIN
 * - File exists
 * - MIME type is PDF
 * - File extension is .pdf
 * - File size is under 10MB
 * - File name is safe (no path traversal)
 * - File name length is reasonable
 * 
 * @param file - File object to validate
 * @param orgId - Organization ID (for authorization)
 * @returns Validation result
 */
export async function validateUpload(
  file: File,
  orgId: string
): Promise<FileValidationResult> {
  try {
    // 1. SECURITY: Require Admin (ORG_ADMIN or DEPARTMENT_ADMIN)
    const userProfile = await getCurrentUserProfile();
    
    if (!userProfile || (userProfile.role !== 'ORG_ADMIN' && userProfile.role !== 'DEPARTMENT_ADMIN')) {
      return {
        valid: false,
        error: 'Unauthorized: Only admins can upload documents',
      };
    }

    if (userProfile.orgId !== orgId) {
      return {
        valid: false,
        error: 'Unauthorized: You can only upload documents to your organization',
      };
    }

    // 2. Check file exists
    if (!file) {
      return {
        valid: false,
        error: 'No file provided',
      };
    }

    // 3. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
      return {
        valid: false,
        error: `Invalid file type. Only PDF files are allowed. Received: ${file.type}`,
      };
    }

    // 4. Validate file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return {
        valid: false,
        error: 'Invalid file extension. Only .pdf files are allowed.',
      };
    }

    // 5. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const maxSizeMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
      return {
        valid: false,
        error: `File too large. Maximum size is ${maxSizeMB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
      };
    }

    // 6. Validate file name length
    if (file.name.length > MAX_FILE_NAME_LENGTH) {
      return {
        valid: false,
        error: `File name too long. Maximum ${MAX_FILE_NAME_LENGTH} characters.`,
      };
    }

    // 7. SECURITY: Sanitize file name (prevent path traversal)
    const sanitizedName = sanitizeFileName(file.name);

    if (!sanitizedName || sanitizedName === '.pdf') {
      return {
        valid: false,
        error: 'Invalid file name',
      };
    }

    // 8. All validations passed
    return {
      valid: true,
      sanitizedName,
    };
  } catch (error) {
    console.error('[Upload Validation] Error:', error);
    return {
      valid: false,
      error: 'Upload validation failed. Please try again.',
    };
  }
}

/**
 * Validate file metadata before database insert
 * 
 * @param metadata - File metadata
 * @returns true if valid, false otherwise
 */
export function validateFileMetadata(metadata: {
  title: string;
  category: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}): { valid: boolean; error?: string } {
  // Validate title
  if (!metadata.title || metadata.title.trim().length === 0) {
    return { valid: false, error: 'Title is required' };
  }

  if (metadata.title.length > 200) {
    return { valid: false, error: 'Title too long (max 200 characters)' };
  }

  // Validate category
  if (!metadata.category || metadata.category.trim().length === 0) {
    return { valid: false, error: 'Category is required' };
  }

  const validCategories = [
    'Compensation & Benefits',
    'Time Off',
    'Code of Conduct',
    'Health & Safety',
    'Training & Development',
    'Other',
  ];

  if (!validCategories.includes(metadata.category)) {
    return { valid: false, error: 'Invalid category' };
  }

  // Validate file name
  if (!metadata.fileName || metadata.fileName.trim().length === 0) {
    return { valid: false, error: 'File name is required' };
  }

  // Validate file size
  if (metadata.fileSize <= 0 || metadata.fileSize > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'Invalid file size' };
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(metadata.mimeType as any)) {
    return { valid: false, error: 'Invalid MIME type' };
  }

  return { valid: true };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Sanitize file name to prevent path traversal and other attacks
 * 
 * @param fileName - Original file name
 * @returns Sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';

  // Remove any path separators (path traversal prevention)
  let sanitized = fileName.replace(/[\/\\]/g, '');

  // Remove any null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.trim().replace(/^\.+/, '');

  // Replace any non-alphanumeric characters (except dots, dashes, underscores, spaces)
  sanitized = sanitized.replace(/[^a-zA-Z0-9._\-\s]/g, '_');

  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Limit length
  if (sanitized.length > MAX_FILE_NAME_LENGTH) {
    const ext = sanitized.split('.').pop() || 'pdf';
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = nameWithoutExt.substring(0, MAX_FILE_NAME_LENGTH - ext.length - 1) + '.' + ext;
  }

  // Ensure it has .pdf extension
  if (!sanitized.toLowerCase().endsWith('.pdf')) {
    sanitized = sanitized + '.pdf';
  }

  // Ensure it's not empty after sanitization
  if (!sanitized || sanitized === '.pdf') {
    sanitized = `document_${Date.now()}.pdf`;
  }

  return sanitized;
}

/**
 * Validate file content (basic checks)
 * 
 * This performs basic validation on file content:
 * - Check PDF magic number
 * - Verify file is not empty
 * 
 * @param buffer - File buffer
 * @returns true if valid PDF
 */
export function validatePDFContent(buffer: ArrayBuffer): boolean {
  try {
    const uint8Array = new Uint8Array(buffer);

    // Check if file is empty
    if (uint8Array.length === 0) {
      return false;
    }

    // Check PDF magic number (should start with %PDF-)
    const pdfMagicNumber = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
    
    if (uint8Array.length < pdfMagicNumber.length) {
      return false;
    }

    for (let i = 0; i < pdfMagicNumber.length; i++) {
      if (uint8Array[i] !== pdfMagicNumber[i]) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('[Upload Validation] Error validating PDF content:', error);
    return false;
  }
}

/**
 * Get user-friendly error message for validation errors
 * 
 * @param error - Error from validation
 * @returns User-friendly message
 */
export function getValidationErrorMessage(error: string): string {
  // Map technical errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'Invalid file type': 'Please upload a PDF file only.',
    'File too large': 'File is too large. Maximum size is 10MB.',
    'Invalid file extension': 'File must have a .pdf extension.',
    'Invalid file name': 'File name contains invalid characters.',
    'Unauthorized': 'You do not have permission to upload files.',
  };

  // Return mapped message or original if not found
  for (const [key, value] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      return value;
    }
  }

  return error || 'Upload failed. Please try again.';
}
