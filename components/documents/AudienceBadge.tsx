import { Badge } from '@/components/ui/badge';
import type { AudienceType } from '@/types/documents';

interface AudienceBadgeProps {
  audienceType: AudienceType;
  allowedDepartments?: string[] | null;
  allowedLocations?: string[] | null;
  allowedEmploymentTypes?: string[] | null;
}

export function AudienceBadge({
  audienceType,
  allowedDepartments,
  allowedLocations,
  allowedEmploymentTypes,
}: AudienceBadgeProps) {
  if (audienceType === 'ALL') {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-700">
        All Employees
      </Badge>
    );
  }

  const segments: string[] = [];
  
  if (allowedDepartments && allowedDepartments.length > 0) {
    segments.push(`${allowedDepartments.length} dept${allowedDepartments.length > 1 ? 's' : ''}`);
  }
  
  if (allowedLocations && allowedLocations.length > 0) {
    segments.push(`${allowedLocations.length} loc${allowedLocations.length > 1 ? 's' : ''}`);
  }
  
  if (allowedEmploymentTypes && allowedEmploymentTypes.length > 0) {
    segments.push(`${allowedEmploymentTypes.length} type${allowedEmploymentTypes.length > 1 ? 's' : ''}`);
  }

  return (
    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
      {segments.length > 0 ? segments.join(', ') : 'Custom'}
    </Badge>
  );
}
