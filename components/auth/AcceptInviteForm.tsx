/**
 * Accept Invite Form Component
 * 
 * Form for accepting an invitation and creating account.
 * Collects full name and password.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { acceptInvitation } from '@/lib/auth/invitations';
import { createClient } from '@/lib/supabase/client';

interface AcceptInviteFormProps {
  token: string;
  defaultFullName: string;
}

export function AcceptInviteForm({ token, defaultFullName }: AcceptInviteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: defaultFullName,
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Validate password strength
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }

      // Accept invitation (creates account)
      const result = await acceptInvitation(
        token,
        formData.password,
        formData.fullName
      );

      if (!result.success) {
        setError(result.error || 'Failed to accept invitation');
        setLoading(false);
        return;
      }

      // Invitation accepted and account created - now sign in
      // The acceptInvitation function already created the user with admin.createUser
      // Now we need to sign them in client-side
      const supabase = createClient();
      
      // Get the invitation details first to get the email
      const { data: inviteData } = await supabase
        .from('invitations')
        .select('email')
        .eq('token', token)
        .single();

      if (!inviteData) {
        setError('Failed to retrieve invitation details');
        setLoading(false);
        return;
      }

      // Sign in with the new account
      const invData = inviteData as any;
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invData.email,
        password: formData.password,
      });

      if (signInError) {
        setError('Account created but sign-in failed. Please try logging in manually.');
        setLoading(false);
        return;
      }

      // Success - redirect based on result
      if (result.redirectUrl) {
        router.push(result.redirectUrl);
        router.refresh();
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Full Name */}
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="John Doe"
          value={formData.fullName}
          onChange={(e) =>
            setFormData({ ...formData, fullName: e.target.value })
          }
          required
          disabled={loading}
          className="mt-1.5"
        />
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="password">Create Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
          minLength={8}
          disabled={loading}
          className="mt-1.5"
        />
        <p className="text-xs text-gray-500 mt-1">
          At least 8 characters
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          required
          minLength={8}
          disabled={loading}
          className="mt-1.5"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        disabled={loading}
      >
        {loading ? 'Creating account...' : 'Accept Invitation & Create Account'}
      </Button>

      {/* Privacy Note */}
      <p className="text-xs text-center text-gray-500">
        By creating an account, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  );
}
