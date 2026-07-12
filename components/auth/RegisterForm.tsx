/**
 * Register Form Component
 * 
 * Form for organization registration.
 * Creates organization and ORG_ADMIN user.
 * No role selection.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerOrganization } from '@/lib/auth/registration';
import { createClient } from '@/lib/supabase/client';

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    adminFullName: '',
    adminEmail: '',
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

      // Register organization
      const result = await registerOrganization({
        companyName: formData.companyName,
        adminFullName: formData.adminFullName,
        adminEmail: formData.adminEmail,
        password: formData.password,
      });

      if (!result.success) {
        setError(result.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Sign in the newly created user
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.adminEmail,
        password: formData.password,
      });

      if (signInError) {
        setError('Registration successful, but sign-in failed. Please try logging in.');
        setLoading(false);
        return;
      }

      // Success - redirect to admin dashboard
      router.push('/admin');
      router.refresh();
    } catch (err) {
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

      {/* Company Name */}
      <div>
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          type="text"
          placeholder="Acme Corporation"
          value={formData.companyName}
          onChange={(e) =>
            setFormData({ ...formData, companyName: e.target.value })
          }
          required
          disabled={loading}
          className="mt-1.5"
        />
      </div>

      {/* Admin Full Name */}
      <div>
        <Label htmlFor="adminFullName">Your Full Name</Label>
        <Input
          id="adminFullName"
          type="text"
          placeholder="John Doe"
          value={formData.adminFullName}
          onChange={(e) =>
            setFormData({ ...formData, adminFullName: e.target.value })
          }
          required
          disabled={loading}
          className="mt-1.5"
        />
      </div>

      {/* Admin Email */}
      <div>
        <Label htmlFor="adminEmail">Your Work Email</Label>
        <Input
          id="adminEmail"
          type="email"
          placeholder="john@acme.com"
          value={formData.adminEmail}
          onChange={(e) =>
            setFormData({ ...formData, adminEmail: e.target.value })
          }
          required
          disabled={loading}
          className="mt-1.5"
        />
        <p className="text-xs text-gray-500 mt-1">
          You'll be the organization admin
        </p>
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="password">Password</Label>
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
        {loading ? 'Creating organization...' : 'Create Organization'}
      </Button>

      {/* Privacy Note */}
      <p className="text-xs text-center text-gray-500">
        By creating an organization, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  );
}
