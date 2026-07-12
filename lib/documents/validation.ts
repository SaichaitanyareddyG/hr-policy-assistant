// Validation utilities for document operations

import type { CreatePolicyDocumentInput, PolicyCategory } from '@/types/documents';
import { POLICY_CATEGORIES } from '@/types/documents';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['application/pdf'];
export const ALLOWED_FILE_EXTENSIONS = ['.pdf'];

export interface ValidationError {
  field: string;
  message: string;
}

export function validatePolicyDocument(
  input: Partial<CreatePolicyDocumentInput>
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate title
  if (!input.title || input.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (input.title.length > 200) {
    errors.push({ field: 'title', message: 'Title must be less than 200 characters' });
  }

  // Validate category
  if (!input.category) {
    errors.push({ field: 'category', message: 'Category is required' });
  } else if (!POLICY_CATEGORIES.includes(input.category as PolicyCategory)) {
    errors.push({ field: 'category', message: 'Invalid category' });
  }

  // Validate file
  if (!input.file) {
    errors.push({ field: 'file', message: 'PDF file is required' });
  } else {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(input.file.type)) {
      errors.push({
        field: 'file',
        message: 'Only PDF files are allowed',
      });
    }

    // Check file size
    if (input.file.size > MAX_FILE_SIZE) {
      errors.push({
        field: 'file',
        message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }

    // Check file extension
    const fileName = input.file.name.toLowerCase();
    const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext)
    );
    if (!hasValidExtension) {
      errors.push({
        field: 'file',
        message: 'File must have a .pdf extension',
      });
    }
  }

  // Validate effective date if provided
  if (input.effective_date) {
    const date = new Date(input.effective_date);
    if (isNaN(date.getTime())) {
      errors.push({ field: 'effective_date', message: 'Invalid date format' });
    }
  }

  // Validate audience settings
  if (input.audience_type === 'CUSTOM') {
    const hasAnyAudience =
      (input.allowed_departments && input.allowed_departments.length > 0) ||
      (input.allowed_locations && input.allowed_locations.length > 0) ||
      (input.allowed_employment_types && input.allowed_employment_types.length > 0);

    if (!hasAnyAudience) {
      errors.push({
        field: 'audience_type',
        message: 'Custom audience requires at least one department, location, or employment type',
      });
    }
  }

  return errors;
}

export function sanitizeFileName(fileName: string): string {
  // Remove special characters and spaces, keep only alphanumeric, dash, underscore, and dot
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
