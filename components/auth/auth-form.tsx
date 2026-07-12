'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/database.types';

interface AuthFormProps {
  type: 'login' | 'signup';
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'EMPLOYEE' as UserRole,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (type === 'login') {
        console.log('[Auth] Attempting login...');
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          console.error('[Auth] Login error:', error);
          throw error;
        }

        console.log('[Auth] Login successful, user:', data.user?.id);

        // Get user profile to determine redirect
        if (data.user) {
          console.log('[Auth] Fetching profile for user:', data.user.id);
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          console.log('[Auth] Profile data:', profile, 'Error:', profileError);

          const p = profile as any;
          if (p?.role === 'ORG_ADMIN' || p?.role === 'DEPARTMENT_ADMIN') {
            console.log('[Auth] Redirecting admin to /admin');
            router.push('/admin');
          } else {
            console.log('[Auth] Redirecting employee to /employee');
            router.push('/employee');
          }
          router.refresh();
        } else {
          console.error('[Auth] No user in response');
          throw new Error('No user data received');
        }
      } else {
        // Signup flow
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data.user) {
          // Get demo organization ID
          const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .limit(1)
            .single();

          // Create profile
          const o = org as any;
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              org_id: o?.id || null,
              full_name: formData.fullName,
              email: formData.email,
              role: formData.role,
            } as any);

          if (profileError) throw profileError;

          // Redirect based on role
          if (formData.role === 'ORG_ADMIN' || formData.role === 'DEPARTMENT_ADMIN') {
            router.push('/admin');
          } else {
            router.push('/employee');
          }
          router.refresh();
        }
      }
    } catch (err: any) {
      console.error('[Auth] Error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {type === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          data-testid="auth-email-input"
        />
      </div>

      <div className="space-y-2">
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
          minLength={6}
          data-testid="auth-password-input"
        />
      </div>

      {type === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="role">I am a</Label>
          <Select
            value={formData.role}
            onValueChange={(value: UserRole) =>
              setFormData({ ...formData, role: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
              <SelectItem value="DEPARTMENT_ADMIN">Department Admin</SelectItem>
              <SelectItem value="ORG_ADMIN">Organization Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md" data-testid="auth-error-message">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading} data-testid="auth-submit-button">
        {loading ? 'Please wait...' : type === 'login' ? 'Sign In' : 'Sign Up'}
      </Button>
    </form>
  );
}
