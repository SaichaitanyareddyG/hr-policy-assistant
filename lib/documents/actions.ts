'use server';

// Server actions for policy document operations

import { createClient } from '@/lib/supabase/server';
import type { ProfileData, PolicyDocumentData } from '@/types/database';
import { revalidatePath } from 'next/cache';
import type {
  CreatePolicyDocumentInput,
  UpdatePolicyDocumentInput,
  DocumentUploadResult,
} from '@/types/documents';
import { validatePolicyDocument } from './validation';
import { uploadPolicyDocument, deletePolicyDocumentFile } from './storage';
import { processPolicyDocument } from '@/lib/processing/process-document';

export async function createPolicyDocument(
  formData: FormData
): Promise<DocumentUploadResult> {
  console.log('[createPolicyDocument] Starting upload process');
  
  try {
    const supabase = await createClient();

    // Get current user and profile
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('[createPolicyDocument] No user found');
      return { success: false, error: 'Unauthorized' };
    }

    console.log('[createPolicyDocument] User authenticated:', user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single() as { data: ProfileData | null; error: any };

    if (!profile || (profile.role !== 'ORG_ADMIN' && profile.role !== 'DEPARTMENT_ADMIN')) {
      console.log('[createPolicyDocument] Unauthorized role:', profile?.role);
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    console.log('[createPolicyDocument] User authorized:', profile.role);

    // Extract form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const version = formData.get('version') as string;
    const effective_date = formData.get('effective_date') as string;
    const audience_type = formData.get('audience_type') as string;
    const file = formData.get('file') as File;

    // Parse array fields
    const allowed_departments = formData.get('allowed_departments')
      ? JSON.parse(formData.get('allowed_departments') as string)
      : null;
    const allowed_locations = formData.get('allowed_locations')
      ? JSON.parse(formData.get('allowed_locations') as string)
      : null;
    const allowed_employment_types = formData.get('allowed_employment_types')
      ? JSON.parse(formData.get('allowed_employment_types') as string)
      : null;

    // Validate input
    const validationErrors = validatePolicyDocument({
      title,
      description,
      category: category as any,
      version,
      effective_date,
      audience_type: audience_type as any,
      allowed_departments,
      allowed_locations,
      allowed_employment_types,
      file,
    });

    if (validationErrors.length > 0) {
      console.log('[createPolicyDocument] Validation errors:', validationErrors);
      return {
        success: false,
        error: validationErrors.map((e) => e.message).join(', '),
      };
    }

    console.log('[createPolicyDocument] Validation passed, uploading file...');

    // Generate document ID
    const documentId = crypto.randomUUID();

    // Upload file to storage
    const uploadResult = await uploadPolicyDocument(
      file,
      profile.org_id!,
      documentId
    );

    if (!uploadResult.success || !uploadResult.filePath) {
      console.log('[createPolicyDocument] File upload failed:', uploadResult.error);
      return { success: false, error: uploadResult.error || 'File upload failed' };
    }

    console.log('[createPolicyDocument] File uploaded successfully:', uploadResult.filePath);

    // Insert document metadata into database
    const documentInsert = {
      id: documentId,
      org_id: profile.org_id!,
      title,
      description: description || null,
      category,
      version: version || null,
      effective_date: effective_date || null,
      audience_type,
      allowed_departments,
      allowed_locations,
      allowed_employment_types,
      file_name: file.name,
      file_path: uploadResult.filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
      status: 'ACTIVE' as const,
    };

    console.log('[createPolicyDocument] Inserting document metadata...');

    const { data: document, error: dbError } = await (supabase as any)
      .from('policy_documents')
      .insert(documentInsert)
      .select()
      .single();

    console.log('[createPolicyDocument] Database insert result:', { document: !!document, error: dbError });

    if (dbError) {
      console.error('[createPolicyDocument] Database error:', dbError);
      // Try to clean up uploaded file
      await deletePolicyDocumentFile(uploadResult.filePath);
      return { success: false, error: 'Failed to save document metadata' };
    }

    if (!document) {
      console.log('[createPolicyDocument] Document is null after insert');
      return { success: false, error: 'Failed to create document' };
    }

    console.log('[createPolicyDocument] Document created successfully:', document.id);

    revalidatePath('/admin/documents');
    revalidatePath('/admin');

    // Trigger processing asynchronously (don't wait for it)
    // Processing will run in the background
    processPolicyDocument(document.id).catch((error) => {
      console.error('Background processing error:', error);
      // Don't fail the upload if processing fails
      // User can reprocess manually later
    });

    console.log('[createPolicyDocument] Upload complete, returning success');
    return { success: true, documentId: document.id };
  } catch (error: any) {
    console.error('[createPolicyDocument] Unexpected error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function updatePolicyDocument(
  input: UpdatePolicyDocumentInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get current user and profile
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single() as { data: ProfileData | null; error: any };

    if (!profile || (profile.role !== 'ORG_ADMIN' && profile.role !== 'DEPARTMENT_ADMIN')) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.version !== undefined) updateData.version = input.version;
    if (input.effective_date !== undefined)
      updateData.effective_date = input.effective_date;
    if (input.audience_type !== undefined)
      updateData.audience_type = input.audience_type;
    if (input.allowed_departments !== undefined)
      updateData.allowed_departments = input.allowed_departments;
    if (input.allowed_locations !== undefined)
      updateData.allowed_locations = input.allowed_locations;
    if (input.allowed_employment_types !== undefined)
      updateData.allowed_employment_types = input.allowed_employment_types;
    if (input.status !== undefined) updateData.status = input.status;

    // Update document
    // @ts-ignore - Supabase generated types
    const { error } = (await supabase
      .from('policy_documents')
      // @ts-ignore
      .update(updateData as any)
      .eq('id', input.id)
      // @ts-ignore
      .eq('org_id', profile.org_id!)) as any;

    if (error) {
      console.error('Update error:', error);
      return { success: false, error: 'Failed to update document' };
    }

    revalidatePath('/admin/documents');
    revalidatePath(`/admin/documents/${input.id}`);
    revalidatePath('/admin');

    return { success: true };
  } catch (error: any) {
    console.error('Update policy document error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function archivePolicyDocument(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  return updatePolicyDocument({
    id: documentId,
    status: 'ARCHIVED',
  });
}

export async function deletePolicyDocument(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get current user and profile
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single() as { data: ProfileData | null; error: any };

    // @ts-ignore - Supabase generated types don't match
    if (!profile || (profile.role !== 'ORG_ADMIN' && profile.role !== 'DEPARTMENT_ADMIN')) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Get document to get file path
    // @ts-ignore - Supabase generated types
    const { data: document } = (await supabase
      .from('policy_documents')
      .select('file_path')
      .eq('id', documentId)
      // @ts-ignore
      .eq('org_id', profile.org_id!)
      .single()) as any;

    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    // Delete from storage
    await deletePolicyDocumentFile(document.file_path);

    // Delete from database
    // @ts-ignore - Supabase generated types
    const { error } = (await supabase
      .from('policy_documents')
      .delete()
      .eq('id', documentId)
      // @ts-ignore
      .eq('org_id', profile.org_id!)) as any;

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: 'Failed to delete document' };
    }

    revalidatePath('/admin/documents');
    revalidatePath('/admin');

    return { success: true };
  } catch (error: any) {
    console.error('Delete policy document error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}
