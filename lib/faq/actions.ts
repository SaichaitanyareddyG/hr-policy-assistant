/**
 * FAQ Management System
 * 
 * Server actions for creating and managing HR-approved FAQs.
 * FAQs are checked before RAG retrieval for instant answers.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getCurrentUserProfile } from '@/lib/auth/permissions';
import { logFAQCreated, logFAQUpdated, logFAQArchived, logFAQAnswerReturned } from '@/lib/audit/audit-logs';

// Service role client for admin operations
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =====================================================
// TYPES
// =====================================================

export type AudienceType = 'ALL' | 'RESTRICTED';
export type FAQStatus = 'ACTIVE' | 'ARCHIVED';

export interface CreateFAQInput {
  question: string;
  answer: string;
  category?: string;
  audienceType?: AudienceType;
  allowedDepartments?: string[];
  allowedLocations?: string[];
  allowedEmploymentTypes?: string[];
}

export interface UpdateFAQInput {
  question?: string;
  answer?: string;
  category?: string;
  audienceType?: AudienceType;
  allowedDepartments?: string[];
  allowedLocations?: string[];
  allowedEmploymentTypes?: string[];
  status?: FAQStatus;
}

export interface FAQ {
  id: string;
  orgId: string;
  question: string;
  answer: string;
  category: string | null;
  audienceType: AudienceType;
  allowedDepartments: string[];
  allowedLocations: string[];
  allowedEmploymentTypes: string[];
  status: FAQStatus;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// CREATE FAQ
// =====================================================

export async function createFAQ(
  input: CreateFAQInput
): Promise<{ success: boolean; faq?: FAQ; error?: string }> {
  try {
    const userProfile = await getCurrentUserProfile();

    if (!userProfile) {
      return { success: false, error: 'Unauthorized' };
    }

    // Only admins can create FAQs
    if (userProfile.role !== 'ORG_ADMIN' && userProfile.role !== 'DEPARTMENT_ADMIN') {
      return { success: false, error: 'Only admins can create FAQs' };
    }

    // Validate inputs
    if (!input.question || input.question.trim().length < 5) {
      return { success: false, error: 'Question must be at least 5 characters' };
    }

    if (!input.answer || input.answer.trim().length < 10) {
      return { success: false, error: 'Answer must be at least 10 characters' };
    }

    // Create FAQ
    const { data: faq, error } = await supabaseAdmin
      .from('approved_faqs')
      .insert({
        org_id: userProfile.orgId,
        question: input.question.trim(),
        answer: input.answer.trim(),
        category: input.category?.trim() || null,
        audience_type: input.audienceType || 'ALL',
        allowed_departments: input.allowedDepartments || [],
        allowed_locations: input.allowedLocations || [],
        allowed_employment_types: input.allowedEmploymentTypes || [],
        status: 'ACTIVE',
        created_by: userProfile.id,
        updated_by: userProfile.id,
      })
      .select()
      .single();

    if (error || !faq) {
      console.error('[FAQ] Error creating FAQ:', error);
      return { success: false, error: 'Failed to create FAQ' };
    }

    // Log audit event
    await logFAQCreated(faq.id, input.question, input.category);

    return {
      success: true,
      faq: {
        id: faq.id,
        orgId: faq.org_id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        audienceType: faq.audience_type as AudienceType,
        allowedDepartments: faq.allowed_departments || [],
        allowedLocations: faq.allowed_locations || [],
        allowedEmploymentTypes: faq.allowed_employment_types || [],
        status: faq.status as FAQStatus,
        createdBy: faq.created_by,
        updatedBy: faq.updated_by,
        createdAt: faq.created_at,
        updatedAt: faq.updated_at,
      },
    };
  } catch (error) {
    console.error('[FAQ] Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =====================================================
// UPDATE FAQ
// =====================================================

export async function updateFAQ(
  faqId: string,
  input: UpdateFAQInput
): Promise<{ success: boolean; faq?: FAQ; error?: string }> {
  try {
    const userProfile = await getCurrentUserProfile();

    if (!userProfile) {
      return { success: false, error: 'Unauthorized' };
    }

    // Only admins can update FAQs
    if (userProfile.role !== 'ORG_ADMIN' && userProfile.role !== 'DEPARTMENT_ADMIN') {
      return { success: false, error: 'Only admins can update FAQs' };
    }

    // Verify FAQ exists and belongs to org
    const supabase = await createClient();
    const { data: existingFAQ } = await supabase
      .from('approved_faqs')
      .select('org_id')
      .eq('id', faqId)
      .single();

    if (!existingFAQ || (existingFAQ as any).org_id !== userProfile.orgId) {
      return { success: false, error: 'FAQ not found' };
    }

    // Build update object
    const updateData: any = {
      updated_by: userProfile.id,
    };

    if (input.question !== undefined) updateData.question = input.question.trim();
    if (input.answer !== undefined) updateData.answer = input.answer.trim();
    if (input.category !== undefined) updateData.category = input.category?.trim() || null;
    if (input.audienceType !== undefined) updateData.audience_type = input.audienceType;
    if (input.allowedDepartments !== undefined) updateData.allowed_departments = input.allowedDepartments;
    if (input.allowedLocations !== undefined) updateData.allowed_locations = input.allowedLocations;
    if (input.allowedEmploymentTypes !== undefined) updateData.allowed_employment_types = input.allowedEmploymentTypes;
    if (input.status !== undefined) updateData.status = input.status;

    // Update FAQ
    const { data: faq, error } = await supabaseAdmin
      .from('approved_faqs')
      .update(updateData)
      .eq('id', faqId)
      .select()
      .single();

    if (error || !faq) {
      console.error('[FAQ] Error updating FAQ:', error);
      return { success: false, error: 'Failed to update FAQ' };
    }

    // Log audit event
    await logFAQUpdated(faq.id, input);

    return {
      success: true,
      faq: {
        id: faq.id,
        orgId: faq.org_id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        audienceType: faq.audience_type as AudienceType,
        allowedDepartments: faq.allowed_departments || [],
        allowedLocations: faq.allowed_locations || [],
        allowedEmploymentTypes: faq.allowed_employment_types || [],
        status: faq.status as FAQStatus,
        createdBy: faq.created_by,
        updatedBy: faq.updated_by,
        createdAt: faq.created_at,
        updatedAt: faq.updated_at,
      },
    };
  } catch (error) {
    console.error('[FAQ] Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =====================================================
// ARCHIVE FAQ
// =====================================================

export async function archiveFAQ(
  faqId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await updateFAQ(faqId, { status: 'ARCHIVED' });
  
  if (result.success) {
    await logFAQArchived(faqId);
  }
  
  return { success: result.success, error: result.error };
}

// =====================================================
// GET FAQs
// =====================================================

export async function getOrganizationFAQs(): Promise<{
  success: boolean;
  faqs?: FAQ[];
  error?: string;
}> {
  try {
    const userProfile = await getCurrentUserProfile();

    if (!userProfile) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    const { data: faqs, error } = await supabase
      .from('approved_faqs')
      .select('*')
      .eq('org_id', userProfile.orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[FAQ] Error fetching FAQs:', error);
      return { success: false, error: 'Failed to fetch FAQs' };
    }

    return {
      success: true,
      faqs: (faqs || []).map((faq: any) => ({
        id: faq.id,
        orgId: faq.org_id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        audienceType: faq.audience_type as AudienceType,
        allowedDepartments: faq.allowed_departments || [],
        allowedLocations: faq.allowed_locations || [],
        allowedEmploymentTypes: faq.allowed_employment_types || [],
        status: faq.status as FAQStatus,
        createdBy: faq.created_by,
        updatedBy: faq.updated_by,
        createdAt: faq.created_at,
        updatedAt: faq.updated_at,
      })),
    };
  } catch (error) {
    console.error('[FAQ] Error fetching FAQs:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =====================================================
// SEARCH FAQs (for chat flow)
// =====================================================

export async function searchFAQs(
  question: string
): Promise<{
  success: boolean;
  faq?: FAQ;
  error?: string;
}> {
  try {
    const userProfile = await getCurrentUserProfile();

    if (!userProfile) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // Simple keyword search using full-text search
    // RLS policies will automatically filter by audience
    const { data: faqs, error } = await supabase
      .from('approved_faqs')
      .select('*')
      .eq('org_id', userProfile.orgId)
      .eq('status', 'ACTIVE')
      .textSearch('question', question, {
        type: 'websearch',
        config: 'english',
      })
      .limit(1);

    if (error) {
      console.error('[FAQ] Error searching FAQs:', error);
      
      // Fallback to ILIKE search if full-text fails
      const { data: fallbackFaqs } = await supabase
        .from('approved_faqs')
        .select('*')
        .eq('org_id', userProfile.orgId)
        .eq('status', 'ACTIVE')
        .ilike('question', `%${question}%`)
        .limit(1);

      if (fallbackFaqs && fallbackFaqs.length > 0) {
        const faq = fallbackFaqs[0] as any;
        
        // Log FAQ answer returned
        await logFAQAnswerReturned(faq.id, question);

        return {
          success: true,
          faq: {
            id: faq.id,
            orgId: faq.org_id,
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            audienceType: faq.audience_type as AudienceType,
            allowedDepartments: faq.allowed_departments || [],
            allowedLocations: faq.allowed_locations || [],
            allowedEmploymentTypes: faq.allowed_employment_types || [],
            status: faq.status as FAQStatus,
            createdBy: faq.created_by,
            updatedBy: faq.updated_by,
            createdAt: faq.created_at,
            updatedAt: faq.updated_at,
          },
        };
      }

      return { success: false, error: 'No matching FAQ found' };
    }

    if (!faqs || faqs.length === 0) {
      return { success: false, error: 'No matching FAQ found' };
    }

    const faq = faqs[0] as any; // Type assertion to fix inference issue
    
    // Log FAQ answer returned
    await logFAQAnswerReturned(faq.id, question);

    return {
      success: true,
      faq: {
        id: faq.id,
        orgId: faq.org_id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        audienceType: faq.audience_type as AudienceType,
        allowedDepartments: faq.allowed_departments || [],
        allowedLocations: faq.allowed_locations || [],
        allowedEmploymentTypes: faq.allowed_employment_types || [],
        status: faq.status as FAQStatus,
        createdBy: faq.created_by,
        updatedBy: faq.updated_by,
        createdAt: faq.created_at,
        updatedAt: faq.updated_at,
      },
    };
  } catch (error) {
    console.error('[FAQ] Error searching FAQs:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
