/**
 * Login Page
 * 
 * Split-screen layout with product message and login form
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthForm } from '@/components/auth/auth-form';
import { Bot, CheckCircle, AlertCircle } from 'lucide-react';

function LogoutMessage({ reason }: { reason?: string }) {
  if (!reason) return null;

  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-yellow-900">You've been logged out</p>
        <p className="text-sm text-yellow-700 mt-1">{reason}</p>
      </div>
    </div>
  );
}

export default async function LoginPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ reason?: string }> 
}) {
  // Await searchParams in Next.js 15
  const params = await searchParams;
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Product Message */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white">
        <Link href="/" className="flex items-center gap-2 mb-16">
          <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold">PolicyPal AI</span>
        </Link>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Welcome back to your policy assistant
          </h1>
          <p className="text-lg text-blue-100 mb-8">
            Sign in to access your HR dashboard or ask policy questions.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-blue-300 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Instant Policy Answers</h3>
                <p className="text-sm text-blue-100">
                  Get answers grounded in your company's approved documents
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-blue-300 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">HR Analytics</h3>
                <p className="text-sm text-blue-100">
                  Track employee questions and improve your policies
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-blue-300 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Secure & Private</h3>
                <p className="text-sm text-blue-100">
                  Your data stays in your Supabase instance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex items-center justify-center p-8 bg-white">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="space-y-1">
            <div className="lg:hidden flex items-center justify-center mb-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">PolicyPal AI</span>
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LogoutMessage reason={params.reason} />
            <AuthForm type="login" />
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </div>
            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
