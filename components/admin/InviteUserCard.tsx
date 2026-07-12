/**
 * Invite User Card Component
 * 
 * Form for inviting new users to the organization.
 * ORG_ADMIN can invite all roles.
 * DEPARTMENT_ADMIN can only invite EMPLOYEE.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createInvitation, type UserRole, type DepartmentScope } from '@/lib/auth/invitations';
import { UserPlus, CheckCircle } from 'lucide-react';

interface InviteUserCardProps {
  userRole: UserRole;
}

export function InviteUserCard({ userRole }: InviteUserCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'EMPLOYEE' as UserRole,
    departmentScope: '' as DepartmentScope | '',
    department: '',
    location: '',
    employmentType: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setInviteLink(null);
    setLoading(true);

    try {
      const result = await createInvitation({
        email: formData.email,
        fullName: formData.fullName || undefined,
        role: formData.role,
        departmentScope: formData.departmentScope || undefined,
        department: formData.department || undefined,
        location: formData.location || undefined,
        employmentType: formData.employmentType || undefined,
      });

      if (!result.success) {
        setError(result.error || 'Failed to create invitation');
        setLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      const link = `${window.location.origin}/invite/${result.token}`;
      setInviteLink(link);

      // Reset form
      setFormData({
        email: '',
        fullName: '',
        role: 'EMPLOYEE',
        departmentScope: '',
        department: '',
        location: '',
        employmentType: '',
      });

      setLoading(false);
    } catch (err) {
      console.error('Error creating invitation:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const canInviteAdmin = userRole === 'ORG_ADMIN';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Invite New User
        </CardTitle>
        <CardDescription>
          {canInviteAdmin
            ? 'Send an invitation to add a new team member to your organization'
            : 'Send an invitation to add a new employee (Department Admins can only invite employees)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Success Message */}
          {success && inviteLink && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 mb-2">
                    Invitation sent successfully!
                  </p>
                  <p className="text-xs text-green-700 mb-2">
                    Share this link with the invited user:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-green-300 rounded-md"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email (Required) */}
            <div>
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
                className="mt-1.5"
              />
            </div>

            {/* Full Name (Optional) */}
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={loading}
                className="mt-1.5"
              />
            </div>

            {/* Role */}
            <div>
              <Label htmlFor="role">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as UserRole })
                }
                disabled={loading || !canInviteAdmin}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  {canInviteAdmin && (
                    <>
                      <SelectItem value="DEPARTMENT_ADMIN">Department Admin</SelectItem>
                      <SelectItem value="ORG_ADMIN">Organization Admin</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Department Scope (for DEPARTMENT_ADMIN only) */}
            {formData.role === 'DEPARTMENT_ADMIN' && (
              <div>
                <Label htmlFor="departmentScope">Department Scope</Label>
                <Select
                  value={formData.departmentScope}
                  onValueChange={(value) =>
                    setFormData({ ...formData, departmentScope: value as DepartmentScope })
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="OPS">Operations</SelectItem>
                    <SelectItem value="LEGAL">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Department (Optional) */}
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                type="text"
                placeholder="Engineering"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                disabled={loading}
                className="mt-1.5"
              />
            </div>

            {/* Location (Optional) */}
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                placeholder="San Francisco, CA"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={loading}
                className="mt-1.5"
              />
            </div>

            {/* Employment Type (Optional) */}
            <div>
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select
                value={formData.employmentType}
                onValueChange={(value) =>
                  setFormData({ ...formData, employmentType: value })
                }
                disabled={loading}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-Time">Full-Time</SelectItem>
                  <SelectItem value="Part-Time">Part-Time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? 'Sending invitation...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
