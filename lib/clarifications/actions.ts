// @ts-nocheck
/**
 * Clarification Request Actions
 * 
 * Allows employees to request HR clarification when AI cannot answer
 * or when answers are not helpful. HR admins can manage and respond.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { PAGINATION } from '@/lib/config';

export interface ClarificationRequest {
  id: string;
  orgId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  question: string;
  aiAnswer: string | null;
  assistantMessageId: string | null;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
  hrResponse: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: string;
  resolvedAt: string | null;
  updatedAt: string;
}

export interface ClarificationRequestsResult {
  requests: ClarificationRequest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Create a clarification request from an employee
 */
export async function createClarificationRequest(params: {
  question: string;
  aiAnswer?: string;
  assistantMessageId?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, org_id')
      .eq('id', user.id)
      .single();

    const p = profile as any;
    if (!profile || !p.org_id) {
      return { success: false, error: 'Profile not found' };
    }

    const { data, error } = await supabase
      .from('hr_clarification_requests')
      .insert({
        org_id: p.org_id,
        employee_id: user.id,
        question: params.question,
        ai_answer: params.aiAnswer || null,
        assistant_message_id: params.assistantMessageId || null,
        status: 'OPEN',
      } as any)
      .select('id')
      .single();

    if (error) {
      console.error('[Clarifications] Error creating request:', error);
      return { success: false, error: 'Failed to create request' };
    }

    revalidatePath('/admin/clarifications');
    revalidatePath('/employee/clarifications');

    const d = data as any;
    return { success: true, id: d.id };
  } catch (error) {
    console.error('[Clarifications] Error:', error);
    return { success: false, error: 'An error occurred' };
  }
}

/**
 * Get clarification requests (for HR admin or employee)
 * Legacy method - returns all requests without pagination
 * For paginated results, use getClarificationRequestsPaginated()
 * 
 * @param filters - Filters for status, employee
 * @returns Array of clarification requests
 */
export async function getClarificationRequests(
  filters?: {
    status?: string;
    employeeId?: string;
  }
): Promise<ClarificationRequest[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, org_id, role')
      .eq('id', user.id)
      .single();

    const p = profile as any;
    if (!profile || !p.org_id) {
      return [];
    }

    let query = supabase
      .from('hr_clarification_requests')
      .select(
        `
        *,
        employee:profiles!hr_clarification_requests_employee_id_fkey(full_name, email),
        assigned:profiles!hr_clarification_requests_assigned_to_fkey(full_name)
      `
      )
      .eq('org_id', p.org_id);

    // If employee, only show their own requests
    const isAdmin = p.role === 'ORG_ADMIN' || p.role === 'DEPARTMENT_ADMIN';
    if (!isAdmin) {
      query = query.eq('employee_id', user.id);
    }

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.employeeId && isAdmin) {
      query = query.eq('employee_id', filters.employeeId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[Clarifications] Error fetching requests:', error);
      return [];
    }

    return (data || []).map((req: any) => ({
      id: req.id,
      orgId: req.org_id,
      employeeId: req.employee_id,
      employeeName: req.employee?.full_name || 'Unknown',
      employeeEmail: req.employee?.email || '',
      question: req.question,
      aiAnswer: req.ai_answer,
      assistantMessageId: req.assistant_message_id,
      status: req.status,
      hrResponse: req.hr_response,
      assignedTo: req.assigned_to,
      assignedToName: req.assigned?.full_name || null,
      createdAt: req.created_at,
      resolvedAt: req.resolved_at,
      updatedAt: req.updated_at,
    }));
  } catch (error) {
    console.error('[Clarifications] Error:', error);
    return [];
  }
}

/**
 * Get clarification requests with pagination and search (NEW)
 * 
 * @param filters - Filters for status, employee, search, pagination
 * @returns Paginated clarification requests with total count
 */
export async function getClarificationRequestsPaginated(
  filters?: {
    status?: string;
    employeeId?: string;
    searchQuery?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<ClarificationRequestsResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        requests: [],
        total: 0,
        page: 1,
        pageSize: PAGINATION.defaultPageSize,
        totalPages: 0,
      };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, org_id, role')
      .eq('id', user.id)
      .single();

    const p = profile as any;
    if (!profile || !p.org_id) {
      return {
        requests: [],
        total: 0,
        page: 1,
        pageSize: PAGINATION.defaultPageSize,
        totalPages: 0,
      };
    }

    // Pagination parameters
    const page = Math.max(1, filters?.page || 1);
    const pageSize = Math.min(
      filters?.pageSize || PAGINATION.defaultPageSize,
      PAGINATION.maxPageSize
    );
    const offset = (page - 1) * pageSize;

    // Build base query for both count and data
    const buildBaseQuery = (selectStr: string) => {
      let query = supabase
        .from('hr_clarification_requests')
        .select(selectStr)
        .eq('org_id', p.org_id);

      // If employee, only show their own requests
      const isAdmin = p.role === 'ORG_ADMIN' || p.role === 'DEPARTMENT_ADMIN';
      if (!isAdmin) {
        query = query.eq('employee_id', user.id);
      }

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.employeeId && isAdmin) {
        query = query.eq('employee_id', filters.employeeId);
      }

      // Search functionality
      if (filters?.searchQuery && filters.searchQuery.trim()) {
        const searchTerm = `%${filters.searchQuery.trim()}%`;
        query = query.or(
          `question.ilike.${searchTerm},hr_response.ilike.${searchTerm}`
        );
      }

      return query;
    };

    // Get total count
    const countQuery = buildBaseQuery('*');
    const countResult: any = await countQuery;
    const { count, error: countError } = await countResult.select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('[Clarifications] Error counting requests:', countError);
      return {
        requests: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // Get paginated data
    let dataQuery = buildBaseQuery(
      `
        *,
        employee:profiles!hr_clarification_requests_employee_id_fkey(full_name, email),
        assigned:profiles!hr_clarification_requests_assigned_to_fkey(full_name)
      `
    );

    dataQuery = dataQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, error } = await dataQuery;

    const d = data as any;
    if (error) {
      console.error('[Clarifications] Error fetching requests:', error);
      return {
        requests: [],
        total,
        page,
        pageSize,
        totalPages,
      };
    }

    const requests = (data || []).map((req: any) => ({
      id: req.id,
      orgId: req.org_id,
      employeeId: req.employee_id,
      employeeName: req.employee?.full_name || 'Unknown',
      employeeEmail: req.employee?.email || '',
      question: req.question,
      aiAnswer: req.ai_answer,
      assistantMessageId: req.assistant_message_id,
      status: req.status,
      hrResponse: req.hr_response,
      assignedTo: req.assigned_to,
      assignedToName: req.assigned?.full_name || null,
      createdAt: req.created_at,
      resolvedAt: req.resolved_at,
      updatedAt: req.updated_at,
    }));

    return {
      requests,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error('[Clarifications] Error:', error);
    return {
      requests: [],
      total: 0,
      page: 1,
      pageSize: PAGINATION.defaultPageSize,
      totalPages: 0,
    };
  }
}

/**
 * Update clarification request status (HR admin only)
 */
export async function updateClarificationStatus(
  requestId: string,
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single();

    const p = profile as any;
    if (!profile || (p.role !== 'ORG_ADMIN' && p.role !== 'DEPARTMENT_ADMIN')) {
      return { success: false, error: 'Only admins can update status' };
    }

    const updateData: any = { status };

    if (status === 'RESOLVED') {
      updateData.resolved_at = new Date().toISOString();
    }

    const baseQuery: any = supabase
      .from('hr_clarification_requests')
      .update(updateData as any);
    const withId: any = (baseQuery as any).eq('id' as any, requestId as any);
    const withOrg: any = (withId as any).eq('org_id' as any, p.org_id as any);
    const { error } = await withOrg;

    if (error) {
      console.error('[Clarifications] Error updating status:', error);
      return { success: false, error: 'Failed to update status' };
    }

    revalidatePath('/admin/clarifications');

    return { success: true };
  } catch (error) {
    console.error('[Clarifications] Error:', error);
    return { success: false, error: 'An error occurred' };
  }
}

/**
 * Resolve clarification request with HR response (HR admin only)
 */
export async function resolveClarificationRequest(
  requestId: string,
  hrResponse: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single();

    const p = profile as any;
    if (!profile || (p.role !== 'ORG_ADMIN' && p.role !== 'DEPARTMENT_ADMIN')) {
      return { success: false, error: 'Only admins can resolve requests' };
    }

    const baseQuery: any = supabase
      .from('hr_clarification_requests')
      .update({
        hr_response: hrResponse,
        status: 'RESOLVED',
        resolved_at: new Date().toISOString(),
        assigned_to: user.id,
      } as any);
    const withId: any = (baseQuery as any).eq('id' as any, requestId as any);
    const withOrg: any = (withId as any).eq('org_id' as any, p.org_id as any);
    const { error } = await withOrg;

    if (error) {
      console.error('[Clarifications] Error resolving request:', error);
      return { success: false, error: 'Failed to resolve request' };
    }

    revalidatePath('/admin/clarifications');
    revalidatePath('/employee/clarifications');

    return { success: true };
  } catch (error) {
    console.error('[Clarifications] Error:', error);
    return { success: false, error: 'An error occurred' };
  }
}

/**
 * Assign clarification request to HR admin
 */
export async function assignClarificationRequest(
  requestId: string,
  assignToUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single();

    const p = profile as any;
    if (!profile || (p.role !== 'ORG_ADMIN' && p.role !== 'DEPARTMENT_ADMIN')) {
      return { success: false, error: 'Only admins can assign requests' };
    }

    const baseQuery: any = supabase
      .from('hr_clarification_requests')
      .update({
        assigned_to: assignToUserId,
        status: 'IN_REVIEW',
      } as any);
    const withId: any = (baseQuery as any).eq('id' as any, requestId as any);
    const withOrg: any = (withId as any).eq('org_id' as any, p.org_id as any);
    const { error } = await withOrg;

    if (error) {
      console.error('[Clarifications] Error assigning request:', error);
      return { success: false, error: 'Failed to assign request' };
    }

    revalidatePath('/admin/clarifications');

    return { success: true };
  } catch (error) {
    console.error('[Clarifications] Error:', error);
    return { success: false, error: 'An error occurred' };
  }
}
