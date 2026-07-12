/**
 * Recent Security Events Component
 * 
 * Shows recent security-relevant audit log entries.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Shield, Key, UserPlus, AlertTriangle } from 'lucide-react';

// Helper function to format dates without external dependency
function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

interface SecurityEvent {
  id: string;
  action: string;
  actor_user_id: string | null;
  resource_type: string | null;
  metadata: any;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

interface RecentSecurityEventsProps {
  events: SecurityEvent[];
}

export function RecentSecurityEvents({ events }: RecentSecurityEventsProps) {
  const getEventIcon = (action: string) => {
    if (action.includes('signed_url')) return Key;
    if (action.includes('invite') || action.includes('user')) return UserPlus;
    if (action.includes('unauthorized') || action.includes('rate_limit')) return AlertTriangle;
    if (action.includes('audience')) return Shield;
    return Activity;
  };

  const getEventBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' => {
    if (action.includes('unauthorized') || action.includes('rate_limit')) return 'destructive';
    if (action.includes('audience_updated')) return 'secondary';
    return 'default';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Security Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No recent security events</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const EventIcon = getEventIcon(event.action);
              
              return (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <EventIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getEventBadgeVariant(event.action)}>
                            {event.action.replace(/_/g, ' ')}
                          </Badge>
                          {event.resource_type && (
                            <Badge variant="outline" className="text-xs">
                              {event.resource_type}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {event.profiles ? (
                            <span>
                              {event.profiles.full_name} ({event.profiles.email})
                            </span>
                          ) : event.actor_user_id ? (
                            <span>User ID: {event.actor_user_id.substring(0, 8)}...</span>
                          ) : (
                            <span className="text-gray-400">System action</span>
                          )}
                        </p>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {event.metadata.file_name && `File: ${event.metadata.file_name}`}
                            {event.metadata.email && `Email: ${event.metadata.email}`}
                            {event.metadata.reason && `Reason: ${event.metadata.reason}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 whitespace-nowrap">
                      {formatEventDate(event.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
