// Storage helper functions for Supabase Storage operations

import { createClient } from '@/lib/supabase/server';
import { sanitizeFileName } from './validation';

const STORAGE_BUCKET = 'policy-documents';
const SIGNED_URL_EXPIRY = 600; // 10 minutes in seconds

export async function uploadPolicyDocument(
  file: File,
  orgId: string,
  documentId: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Sanitize filename
    const sanitizedFileName = sanitizeFileName(file.name);
    
    // Create file path: org_id/document_id/filename.pdf
    const filePath = `${orgId}/${documentId}/${sanitizedFileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, filePath: data.path };
  } catch (error: any) {
    console.error('Upload error:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}

export async function getPolicyDocumentSignedUrl(
  filePath: string
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

    if (error) {
      console.error('Signed URL error:', error);
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error: any) {
    console.error('Signed URL generation error:', error);
    return { error: error.message || 'Failed to generate signed URL' };
  }
}

export async function deletePolicyDocumentFile(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Delete error:', error);
    return { success: false, error: error.message || 'Delete failed' };
  }
}

export async function getDocumentDownloadUrl(filePath: string): Promise<string | null> {
  const result = await getPolicyDocumentSignedUrl(filePath);
  return result.url || null;
}
