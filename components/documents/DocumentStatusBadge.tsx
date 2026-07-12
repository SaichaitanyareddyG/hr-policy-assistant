import { Badge } from '@/components/ui/badge';
import type { DocumentStatus } from '@/types/documents';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const variants: Record<
    DocumentStatus,
    { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
  > = {
    ACTIVE: { variant: 'default', label: 'Active' },
    INACTIVE: { variant: 'secondary', label: 'Inactive' },
    ARCHIVED: { variant: 'outline', label: 'Archived' },
  };

  const { variant, label } = variants[status];

  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  );
}
