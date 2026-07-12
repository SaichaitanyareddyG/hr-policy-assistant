/**
 * Pending Invitations Card Component
 * 
 * Shows pending, expired, and recent invitations.
 * Allows resending and revoking invitations.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getOrganizationInvitations,
  revokeInvitation,
  resendInvitation,
  type Invitation,
  type UserRole,
} from '@/lib/auth/invitations';
import { Mail, Clock, CheckCircle, XCircle, RefreshCw, X } from 'lucide-react';

interface PendingInvitationsCardProps {
  userRole: UserRole;
}

export function PendingInvitationsCard({ userRole }: PendingInvitationsCardProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadInvitations = async () => {
    setLoading(true);
    const result = await getOrganizationInvitations();
    if (result.success && result.invitations) {
      setInvitations(result.invitations);
    } else {
      setError(result.error || 'Failed to load invitations');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const handleRevoke = async (invitationId: string) => {
    setActionLoading(invitationId);
    const result = await revokeInvitation(invitationId);
    if (result.success) {
      await loadInvitations();
    } else {
      alert(result.error || 'Failed to revoke invitation');
    }
    setActionLoading(null);
  };

  const handleResend = async (invitationId: string) => {
    setActionLoading(invitationId);
    const result = await resendInvitation(invitationId);
    if (result.success) {
      await loadInvitations();
      if (result.token) {
        const link = `${window.location.origin}/invite/${result.token}`;
        navigator.clipboard.writeText(link);
        alert('New invitation link copied to clipboard!');
      }
    } else {
      alert(result.error || 'Failed to resend invitation');
    }
    setActionLoading(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'ACCEPTED':
        return (
          <Badge variant="outline" className="text-green-600 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="outline" className="text-gray-500 border-gray-300">
            <Clock className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      case 'REVOKED':
        return (
          <Badge variant="outline" className="text-red-600 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Revoked
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ORG_ADMIN':
        return 'Org Admin';
      case 'DEPARTMENT_ADMIN':
        return 'Dept Admin';
      case 'EMPLOYEE':
        return 'Employee';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading invitations...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const pendingInvites = invitations.filter((inv) => inv.status === 'PENDING');
  const recentInvites = invitations.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Invitations
        </CardTitle>
        <CardDescription>
          {pendingInvites.length > 0
            ? `${pendingInvites.length} pending invitation${pendingInvites.length > 1 ? 's' : ''}`
            : 'No pending invitations'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentInvites.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No invitations yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-start justify-between p-4 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{invite.email}</h4>
                    {getStatusBadge(invite.status)}
                    <Badge variant="secondary" className="text-xs">
                      {getRoleLabel(invite.role)}
                    </Badge>
                  </div>
                  {invite.fullName && (
                    <p className="text-sm text-gray-600 mb-1">
                      Name: {invite.fullName}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      Created {new Date(invite.createdAt).toLocaleDateString()}
                    </span>
                    {invite.status === 'PENDING' && (
                      <span>
                        Expires {new Date(invite.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                    {invite.acceptedAt && (
                      <span className="text-green-600">
                        Accepted {new Date(invite.acceptedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {invite.status === 'PENDING' && (
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResend(invite.id)}
                      disabled={actionLoading === invite.id}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Resend
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevoke(invite.id)}
                      disabled={actionLoading === invite.id}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Revoke
                    </Button>
                  </div>
                )}
                {invite.status === 'EXPIRED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResend(invite.id)}
                    disabled={actionLoading === invite.id}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Resend
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
