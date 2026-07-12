/**
 * Organization Registration Page
 * 
 * Public registration for creating a new organization.
 * Creates organization and first ORG_ADMIN user.
 * No role selection - always creates ORG_ADMIN.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Bot, Building2, Shield, Users, Sparkles } from 'lucide-react';

export default async function RegisterPage() {
  // Check if user is already authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // User already logged in, redirect to appropriate dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const p = profile as any;
    if (p) {
      if (p.role === 'EMPLOYEE') {
        redirect('/employee/chat');
      } else {
        redirect('/admin');
      }
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-center px-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700">
        <div className="max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">PolicyPal AI</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-white text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Start your free organization
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold text-white mb-4">
            Give your team instant policy answers
          </h1>
          <p className="text-lg text-indigo-100 mb-12">
            Create your organization and become the admin. Invite your team members after registration.
          </p>

          {/* Benefits */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Your Own Organization</h3>
                <p className="text-indigo-100 text-sm">
                  Complete control over your company's policies and team members
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Invite Your Team</h3>
                <p className="text-indigo-100 text-sm">
                  Send secure invitations to employees and department admins
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Secure & Private</h3>
                <p className="text-indigo-100 text-sm">
                  Your data stays in your own Supabase instance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
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
              Create your organization
            </h2>
            <p className="text-gray-600">
              Register as an organization admin. You'll be able to invite team members after signup.
            </p>
          </div>

          {/* Registration Form */}
          <RegisterForm />

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 block"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
