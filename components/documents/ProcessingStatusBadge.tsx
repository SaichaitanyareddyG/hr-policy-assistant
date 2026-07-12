/**
 * Processing Status Badge Component
 * 
 * Displays the processing status of a policy document with appropriate colors.
 * 
 * Status colors:
 * - PENDING: gray (not yet processed)
 * - PROCESSING: blue (currently being processed)
 * - COMPLETED: green (successfully processed)
 * - FAILED: red (processing failed)
 * - NEEDS_OCR: yellow (requires OCR for scanned documents)
 */

import { Badge } from '@/components/ui/badge';
import { ProcessingStatus } from '@/types/documents';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface ProcessingStatusBadgeProps {
  status: ProcessingStatus;
  showIcon?: boolean;
  className?: string;
}

export function ProcessingStatusBadge({
  status,
  showIcon = true,
  className,
}: ProcessingStatusBadgeProps) {
  const getStatusConfig = (status: ProcessingStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Pending',
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-gray-100 text-gray-700 border-gray-300',
        };
      case 'PROCESSING':
        return {
          label: 'Processing',
          variant: 'default' as const,
          icon: Loader2,
          className: 'bg-blue-100 text-blue-700 border-blue-300',
          animate: true,
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          variant: 'default' as const,
          icon: CheckCircle2,
          className: 'bg-green-100 text-green-700 border-green-300',
        };
      case 'FAILED':
        return {
          label: 'Failed',
          variant: 'destructive' as const,
          icon: XCircle,
          className: 'bg-red-100 text-red-700 border-red-300',
        };
      case 'NEEDS_OCR':
        return {
          label: 'Needs OCR',
          variant: 'default' as const,
          icon: AlertTriangle,
          className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
          icon: Clock,
          className: '',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${className || ''}`}>
      {showIcon && (
        <Icon
          className={`w-3 h-3 mr-1 ${config.animate ? 'animate-spin' : ''}`}
        />
      )}
      {config.label}
    </Badge>
  );
}
