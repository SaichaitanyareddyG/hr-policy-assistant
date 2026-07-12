'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Download, Edit, Archive, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { ProcessingStatusBadge } from './ProcessingStatusBadge';
import { AudienceBadge } from './AudienceBadge';
import { EmbeddingStatusBadge } from './EmbeddingStatusBadge';
import type { PolicyDocumentWithUploader } from '@/types/documents';

interface DocumentTableProps {
  documents: PolicyDocumentWithUploader[];
  onView?: (document: PolicyDocumentWithUploader) => void;
  onEdit?: (document: PolicyDocumentWithUploader) => void;
  onDownload?: (document: PolicyDocumentWithUploader) => void;
  onArchive?: (document: PolicyDocumentWithUploader) => void;
  onDelete?: (document: PolicyDocumentWithUploader) => void;
  onGenerateEmbeddings?: (document: PolicyDocumentWithUploader) => void;
  onReprocess?: (document: PolicyDocumentWithUploader) => void;
}

export function DocumentTable({
  documents,
  onView,
  onEdit,
  onDownload,
  onArchive,
  onDelete,
  onGenerateEmbeddings,
  onReprocess,
}: DocumentTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Audience</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Effective Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Processing</TableHead>
            <TableHead>Chunks</TableHead>
            <TableHead>Embeddings</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                No documents found
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>{doc.category}</TableCell>
                <TableCell>
                  <AudienceBadge
                    audienceType={doc.audience_type}
                    allowedDepartments={doc.allowed_departments}
                    allowedLocations={doc.allowed_locations}
                    allowedEmploymentTypes={doc.allowed_employment_types}
                  />
                </TableCell>
                <TableCell>{doc.version || '-'}</TableCell>
                <TableCell>
                  {doc.effective_date ? formatDate(doc.effective_date) : '-'}
                </TableCell>
                <TableCell>
                  <DocumentStatusBadge status={doc.status} />
                </TableCell>
                <TableCell>
                  <ProcessingStatusBadge status={doc.processing_status} />
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {doc.chunks_count !== null && doc.chunks_count !== undefined
                    ? doc.chunks_count
                    : '-'}
                </TableCell>
                <TableCell>
                  <EmbeddingStatusBadge
                    embeddedChunks={doc.embedded_chunks || 0}
                    totalChunks={doc.total_chunks || doc.chunks_count || 0}
                    processingStatus={doc.processing_status}
                  />
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(doc.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(doc)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      {onDownload && (
                        <DropdownMenuItem onClick={() => onDownload(doc)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(doc)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Metadata
                        </DropdownMenuItem>
                      )}
                      
                      {/* Generate Embeddings action */}
                      {onGenerateEmbeddings && doc.processing_status === 'COMPLETED' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onGenerateEmbeddings(doc)}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            {doc.has_embeddings ? 'Regenerate Embeddings' : 'Generate Embeddings'}
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {/* Reprocess action for failed documents */}
                      {onReprocess && (doc.processing_status === 'FAILED' || doc.processing_status === 'NEEDS_OCR') && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onReprocess(doc)}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reprocess Document
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {onArchive && doc.status === 'ACTIVE' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onArchive(doc)}>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(doc)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
