/**
 * Organization Registration Action
 * 
 * Creates new organization and first admin user.
 * This is the only public registration flow.
 * All other users must be invited.
 * 
 * SECURITY: Creates ORG_ADMIN only. No role selection.
 */

'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';

// Service role client for operations that bypass RLS
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface RegisterOrganizationInput {
  companyName: string;
  adminFullName: string;
  adminEmail: string;
  password: string;
}

/**
 * Register a new organization with admin user
 * 
 * Flow:
 * 1. Validate inputs
 * 2. Check email not already used
 * 3. Create organization
 * 4. Create Supabase auth user
 * 5. Create profile with ORG_ADMIN role
 * 6. Return success
 * 
 * @param input - Registration details
 * @returns Success status
 */
export async function registerOrganization(
  input: RegisterOrganizationInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Validate inputs
    if (!input.companyName || input.companyName.trim().length < 2) {
      return { success: false, error: 'Company name must be at least 2 characters' };
    }

    if (!input.adminFullName || input.adminFullName.trim().length < 2) {
      return { success: false, error: 'Full name must be at least 2 characters' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.adminEmail)) {
      return { success: false, error: 'Invalid email address' };
    }

    // Validate password strength
    if (input.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    // 2. Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUser?.users?.some(
      (user) => user.email?.toLowerCase() === input.adminEmail.toLowerCase()
    );

    if (emailExists) {
      return {
        success: false,
        error: 'An account with this email already exists',
      };
    }

    // 3. Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: input.companyName.trim(),
      })
      .select()
      .single();

    if (orgError || !org) {
      console.error('[Registration] Error creating organization:', orgError);
      return { success: false, error: 'Failed to create organization' };
    }

    // 4. Create Supabase auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.adminEmail.toLowerCase(),
      password: input.password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError || !authData.user) {
      console.error('[Registration] Error creating auth user:', authError);
      // Rollback: delete organization
      await supabaseAdmin.from('organizations').delete().eq('id', org.id);
      return { success: false, error: 'Failed to create user account' };
    }

    // 5. Create profile with ORG_ADMIN role
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      org_id: org.id,
      email: input.adminEmail.toLowerCase(),
      full_name: input.adminFullName.trim(),
      role: 'ORG_ADMIN', // Always ORG_ADMIN for registration
    });

    if (profileError) {
      console.error('[Registration] Error creating profile:', profileError);
      // Rollback: delete auth user and organization
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from('organizations').delete().eq('id', org.id);
      return { success: false, error: 'Failed to create user profile' };
    }

    console.log(`[Registration] Successfully registered organization: ${org.name} with admin: ${input.adminEmail}`);

    return { success: true };
  } catch (error) {
    console.error('[Registration] Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred during registration' };
  }
}
