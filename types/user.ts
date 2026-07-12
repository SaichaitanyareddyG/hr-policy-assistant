/**
 * TypeScript Types for User and Profile
 * 
 * Centralized type definitions for user-related data
 */

export type UserRole = 'ORG_ADMIN' | 'DEPARTMENT_ADMIN' | 'EMPLOYEE';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  org_id: string;
  department: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Organization {
  id: string;
  name: string;
  domain: string | null;
  created_at: string;
}

export interface UserWithOrganization extends UserProfile {
  organization?: Organization;
}

// Helper type for form inputs
export interface UserFormData {
  full_name: string;
  email: string;
  department?: string;
  role?: UserRole;
}

// Helper type for authentication
export interface AuthUser {
  id: string;
  email: string;
}

// Helper type for role display
export const ROLE_LABELS: Record<UserRole, string> = {
  ORG_ADMIN: 'Organization Admin',
  DEPARTMENT_ADMIN: 'Department Admin',
  EMPLOYEE: 'Employee',
};

// Helper function to get role label
export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

// Helper function to check if user is admin
export function isAdmin(role: UserRole): boolean {
  return role === 'ORG_ADMIN' || role === 'DEPARTMENT_ADMIN';
}

// Helper function to check if user is org admin
export function isOrgAdmin(role: UserRole): boolean {
  return role === 'ORG_ADMIN';
}
