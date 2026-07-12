/**
 * Invitation Accept Page
 * 
 * Users click a link /invite/[token] to accept their invitation.
 * Validates token, shows org/role/email, collects password, creates account.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getInvitationByToken } from '@/lib/auth/invitations';
import { AcceptInviteForm } from '@/components/auth/AcceptInviteForm';
import { Bot, Building2, Shield, XCircle } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InviteAcceptPage({ params }: PageProps) {
  const { token } = await params;

  // Check if user is already authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // User already logged in, cannot accept invitation
    redirect('/');
  }

  // Validate invitation token
  const inviteResult = await getInvitationByToken(token);

  if (!inviteResult.success || !inviteResult.invitation) {
    // Invalid or expired invitation
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Invitation
            </h2>
            <p className="text-gray-600 mb-6">
              {inviteResult.error || 'This invitation link is not valid or has expired.'}
            </p>

            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const invitation = inviteResult.invitation;

  // Get organization name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', invitation.orgId)
    .single();

  const o = org as any;
  const orgName = o?.name || 'Unknown Organization';

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-center px-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">PolicyPal AI</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to {orgName}
          </h1>
          <p className="text-lg text-blue-100 mb-12">
            You've been invited to join {orgName} on PolicyPal AI. Complete your account setup to get started.
          </p>

          {/* Benefits */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Join Your Team</h3>
                <p className="text-blue-100 text-sm">
                  Access your organization's policies and resources
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Secure Access</h3>
                <p className="text-blue-100 text-sm">
                  Your data is protected with enterprise-grade security
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Accept invitation form */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md mx-auto">
          {/* Logo (mobile only) */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PolicyPal AI</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Accept your invitation
            </h2>
            <p className="text-gray-600">
              Complete your account setup to join {orgName}
            </p>
          </div>

          {/* Invitation Details Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Organization:</span>
                <span className="font-medium text-gray-900">{orgName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{invitation.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium text-gray-900">
                  {invitation.role === 'ORG_ADMIN'
                    ? 'Organization Admin'
                    : invitation.role === 'DEPARTMENT_ADMIN'
                    ? 'Department Admin'
                    : 'Employee'}
                </span>
              </div>
              {invitation.department && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium text-gray-900">{invitation.department}</span>
                </div>
              )}
            </div>
          </div>

          {/* Accept Form */}
          <AcceptInviteForm
            token={token}
            defaultFullName={invitation.fullName || ''}
          />

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
