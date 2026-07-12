// Database query functions for policy documents

import { createClient } from '@/lib/supabase/server';
import type {
  PolicyDocument,
  PolicyDocumentWithUploader,
  DocumentFilters,
} from '@/types/documents';
import type { Profile } from '@/types/database.types';

export async function getAdminPolicyDocuments(
  orgId: string,
  filters?: DocumentFilters
): Promise<PolicyDocumentWithUploader[]> {
  const supabase = await createClient();

  let query = supabase
    .from('policy_documents')
    .select(`
      *,
      profiles:uploaded_by (
        full_name,
        email
      )
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching policy documents:', error);
    return [];
  }

  // Get embedding statistics for each document
  const documentsWithEmbeddings = await Promise.all(
    (data || []).map(async (doc: any) => {
      const embeddingStats = await getDocumentEmbeddingStats(doc.id);
      
      return {
        ...doc,
        uploader_name: doc.profiles?.full_name || 'Unknown',
        uploader_email: doc.profiles?.email || '',
        embedded_chunks: embeddingStats.embeddedChunks,
        total_chunks: embeddingStats.totalChunks,
        has_embeddings: embeddingStats.hasEmbeddings,
      };
    })
  );

  return documentsWithEmbeddings;
}

/**
 * Get embedding statistics for a document
 */
async function getDocumentEmbeddingStats(
  documentId: string
): Promise<{ totalChunks: number; embeddedChunks: number; hasEmbeddings: boolean }> {
  const supabase = await createClient();

  // Get total chunks
  const { count: totalChunks } = await supabase
    .from('policy_document_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('document_id', documentId);

  // Get embedded chunks (where embedding is not null)
  const { count: embeddedChunks } = await supabase
    .from('policy_document_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('document_id', documentId)
    .not('embedding', 'is', null);

  return {
    totalChunks: totalChunks || 0,
    embeddedChunks: embeddedChunks || 0,
    hasEmbeddings: (embeddedChunks || 0) > 0,
  };
}

export async function getPolicyDocumentById(
  documentId: string,
  orgId: string
): Promise<PolicyDocument | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('policy_documents')
    .select('*')
    .eq('id', documentId)
    .eq('org_id', orgId)
    .single();

  if (error) {
    console.error('Error fetching policy document:', error);
    return null;
  }

  return data;
}

export async function getEmployeeVisiblePolicies(
  profile: Profile,
  filters?: DocumentFilters
): Promise<PolicyDocument[]> {
  const supabase = await createClient();

  // First, get all ACTIVE documents in the user's organization
  let query = supabase
    .from('policy_documents')
    .select('*')
    .eq('org_id', profile.org_id!)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching employee policies:', error);
    return [];
  }

  // Filter documents based on audience settings
  // A document is visible if:
  // 1. audience_type is 'ALL'
  // OR
  // 2. audience_type is 'CUSTOM' and the employee matches at least one criterion
  const visibleDocuments = (data || []).filter((doc: PolicyDocument) => {
    if (doc.audience_type === 'ALL') {
      return true;
    }

    // For CUSTOM audience, check if employee matches any of the allowed criteria
    const matchesDepartment =
      !doc.allowed_departments ||
      doc.allowed_departments.length === 0 ||
      (profile.department && doc.allowed_departments.includes(profile.department));

    const matchesLocation =
      !doc.allowed_locations ||
      doc.allowed_locations.length === 0 ||
      (profile.location && doc.allowed_locations.includes(profile.location));

    const matchesEmploymentType =
      !doc.allowed_employment_types ||
      doc.allowed_employment_types.length === 0 ||
      (profile.employment_type &&
        doc.allowed_employment_types.includes(profile.employment_type));

    // Return true if at least one criterion matches
    return matchesDepartment || matchesLocation || matchesEmploymentType;
  });

  return visibleDocuments;
}

export async function getActivePolicyCount(orgId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('policy_documents')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'ACTIVE');

  if (error) {
    console.error('Error counting policy documents:', error);
    return 0;
  }

  return count || 0;
}
