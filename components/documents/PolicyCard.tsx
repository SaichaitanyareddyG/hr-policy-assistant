'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar } from 'lucide-react';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { AudienceBadge } from './AudienceBadge';
import type { PolicyDocument } from '@/types/documents';
import { formatFileSize } from '@/lib/documents/validation';

interface PolicyCardProps {
  document: PolicyDocument;
  onView?: (document: PolicyDocument) => void;
  onDownload?: (document: PolicyDocument) => void;
  showStatus?: boolean;
}

export function PolicyCard({ document, onView, onDownload, showStatus = false }: PolicyCardProps) {
  const formattedDate = document.effective_date
    ? new Date(document.effective_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{document.title}</CardTitle>
              <CardDescription className="mt-1">{document.category}</CardDescription>
            </div>
          </div>
          {showStatus && <DocumentStatusBadge status={document.status} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {document.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{document.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500">
          {formattedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
          )}
          {document.version && <span className="font-medium">v{document.version}</span>}
          {document.file_size && (
            <span className="text-xs">{formatFileSize(document.file_size)}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <AudienceBadge
            audienceType={document.audience_type}
            allowedDepartments={document.allowed_departments}
            allowedLocations={document.allowed_locations}
            allowedEmploymentTypes={document.allowed_employment_types}
          />
        </div>

        <div className="flex gap-2 pt-2">
          {onView && (
            <Button variant="outline" onClick={() => onView(document)} className="flex-1">
              View Policy
            </Button>
          )}
          {onDownload && (
            <Button variant="ghost" size="icon" onClick={() => onDownload(document)}>
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
