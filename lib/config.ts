/**
 * Application Configuration
 * 
 * Centralized configuration for constants and app-wide settings
 */

export const APP_CONFIG = {
  name: 'PolicyPal AI',
  description: 'Secure internal company policy assistant',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

export const AUTH_CONFIG = {
  cookieName: 'sb-auth-token',
  sessionDuration: 3600, // 1 hour in seconds
  passwordMinLength: 8,
  idleTimeout: 1800, // 30 minutes of inactivity before auto logout
  sessionCheckInterval: 60000, // Check session every 60 seconds
  logoutWarningTime: 300, // Show warning 5 minutes before auto logout
} as const;

export const RATE_LIMITS = {
  chatQuestions: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  signedUrls: {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  uploads: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const;

export const FILE_CONFIG = {
  maxUploadSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  allowedExtensions: ['.pdf', '.docx', '.txt'],
  signedUrlExpiry: 600, // 10 minutes
} as const;

export const DOCUMENT_CATEGORIES = [
  'HR',
  'IT',
  'Finance',
  'Legal',
  'Operations',
  'Benefits',
  'Compliance',
  'Training',
  'Other',
] as const;

export const DOCUMENT_STATUSES = [
  'draft',
  'active',
  'archived',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const AI_CONFIG = {
  model: 'gemini-1.5-flash',
  embeddingModel: 'text-embedding-004',
  embeddingDimensions: 768,
  maxContextChunks: 5,
  chunkSize: 1000,
  chunkOverlap: 200,
  temperature: 0.3,
  maxTokens: 1000,
} as const;

export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
  auditLogsPageSize: 50,
} as const;

// Helper to check if a file type is allowed
export function isAllowedFileType(mimeType: string): boolean {
  return (FILE_CONFIG.allowedMimeTypes as readonly string[]).includes(mimeType);
}

// Helper to check if file extension is allowed
export function isAllowedFileExtension(filename: string): boolean {
  return FILE_CONFIG.allowedExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper to check if file size is valid
export function isValidFileSize(bytes: number): boolean {
  return bytes > 0 && bytes <= FILE_CONFIG.maxUploadSize;
}
