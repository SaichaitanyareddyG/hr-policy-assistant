import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPolicyDocumentById } from '@/lib/documents/queries';
import { getDocumentChunks } from '@/lib/processing/process-document';
import { getDocumentEmbeddingStatus } from '@/lib/ai/semantic-retrieval';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import { ProcessingStatusBadge } from '@/components/documents/ProcessingStatusBadge';
import { EmbeddingStatusBadge } from '@/components/documents/EmbeddingStatusBadge';
import { AudienceBadge } from '@/components/documents/AudienceBadge';
import { ReprocessDocumentButton } from '@/components/documents/ReprocessDocumentButton';
import { GenerateEmbeddingsButton } from '@/components/documents/GenerateEmbeddingsButton';
import { ChunkPreviewList } from '@/components/documents/ChunkPreviewList';
import { Button } from '@/components/ui/button';
import { Edit, Download, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatFileSize } from '@/lib/documents/validation';
import { getPolicyDocumentSignedUrl } from '@/lib/documents/storage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const p = profile as any;
  if (!profile || (p.role !== 'ORG_ADMIN' && p.role !== 'DEPARTMENT_ADMIN')) {
    redirect('/admin');
  }

  const document = await getPolicyDocumentById(id, p.org_id!);

  if (!document) {
    redirect('/admin/documents');
  }

  // Get chunks if processing is completed
  const chunksResult =
    document.processing_status === 'COMPLETED'
      ? await getDocumentChunks(id)
      : { data: null, error: null };

  // Get embedding status if chunks exist
  const embeddingStatus =
    document.processing_status === 'COMPLETED' && document.chunks_count && document.chunks_count > 0
      ? await getDocumentEmbeddingStatus(id)
      : {
          totalChunks: 0,
          embeddedChunks: 0,
          percentage: 0,
          status: 'not_started' as const,
        };

  // Get signed URL for download
  const downloadUrl = await getPolicyDocumentSignedUrl(document.file_path);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
          <p className="text-gray-500 mt-1">{document.category}</p>
        </div>
        <div className="flex gap-2">
          {downloadUrl && typeof downloadUrl === 'string' && (
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </a>
          )}
          <Link href={`/admin/documents/${id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Metadata
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
          <CardDescription>Details about this policy document</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <div className="mt-1">
                <DocumentStatusBadge status={document.status} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Audience</p>
              <div className="mt-1">
                <AudienceBadge
                  audienceType={document.audience_type}
                  allowedDepartments={document.allowed_departments}
                  allowedLocations={document.allowed_locations}
                  allowedEmploymentTypes={document.allowed_employment_types}
                />
              </div>
            </div>
            {document.version && (
              <div>
                <p className="text-sm font-medium text-gray-500">Version</p>
                <p className="mt-1">{document.version}</p>
              </div>
            )}
            {document.effective_date && (
              <div>
                <p className="text-sm font-medium text-gray-500">Effective Date</p>
                <p className="mt-1">{formatDate(document.effective_date)}</p>
              </div>
            )}
          </div>
{/* Processing Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Processing Status</CardTitle>
              <CardDescription>Text extraction and chunking information</CardDescription>
            </div>
            <ReprocessDocumentButton
              documentId={id}
              documentTitle={document.title}
              variant="outline"
              size="sm"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Processing Status</p>
              <div className="mt-1">
                <ProcessingStatusBadge status={document.processing_status} />
              </div>
            </div>
            {document.processed_at && (
              <div>
                <p className="text-sm font-medium text-gray-500">Processed At</p>
                <p className="mt-1">{formatDate(document.processed_at)}</p>
              </div>
            )}
            {document.extracted_text_length !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Extracted Text Length</p>
                <p className="mt-1">{document.extracted_text_length.toLocaleString()} characters</p>
              </div>
            )}
            {document.chunks_count !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Chunks Created</p>
                <p className="mt-1">{document.chunks_count} chunks</p>
              </div>
            )}
          </div>

          {document.processing_error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Processing Error</p>
                  <p className="text-sm text-red-700 mt-1">{document.processing_error}</p>
                </div>
              </div>
            </div>
          )}

          {document.processing_status === 'PENDING' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-700">
                This document is queued for processing. Text extraction will begin shortly.
              </p>
            </div>
          )}

          {document.processing_status === 'PROCESSING' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-700">
                Processing in progress. This may take a few moments depending on document size.
              </p>
            </div>
          )}

          {document.processing_status === 'NEEDS_OCR' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-700">
                This PDF appears to be scanned or image-based. OCR support will be added in a future update.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Embedding Status */}
      {document.processing_status === 'COMPLETED' && document.chunks_count && document.chunks_count > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Semantic Search Embeddings</CardTitle>
                <CardDescription>Vector embeddings for AI-powered semantic search</CardDescription>
              </div>
              <GenerateEmbeddingsButton
                documentId={id}
                documentTitle={document.title}
                hasEmbeddings={embeddingStatus.status !== 'not_started'}
                variant="outline"
                size="sm"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Embedding Status</p>
                <div className="mt-1">
                  <EmbeddingStatusBadge
                    embeddedChunks={embeddingStatus.embeddedChunks}
                    totalChunks={embeddingStatus.totalChunks}
                    processingStatus={document.processing_status}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Embedded Chunks</p>
                <p className="mt-1">
                  {embeddingStatus.embeddedChunks} / {embeddingStatus.totalChunks}
                </p>
              </div>
            </div>

            {embeddingStatus.status === 'not_started' && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-700">
                  Generate embeddings to enable semantic search. Employees will be able to find
                  relevant policies even without exact keyword matches.
                </p>
              </div>
            )}

            {embeddingStatus.status === 'partial' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-700">
                  Some chunks are missing embeddings. Generate embeddings to complete semantic
                  search coverage.
                </p>
              </div>
            )}

            {embeddingStatus.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm text-green-700">
                  All chunks have embeddings. Employees can now use semantic search to find
                  information in this document.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chunks Section */}
      {document.processing_status === 'COMPLETED' && chunksResult.data && (
        <ChunkPreviewList chunks={chunksResult.data} />
      )}

      
          {document.description && (
            <div>
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="mt-1 text-gray-700">{document.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">File Name</p>
              <p className="mt-1">{document.file_name}</p>
            </div>
            {document.file_size && (
              <div>
                <p className="text-sm font-medium text-gray-500">File Size</p>
                <p className="mt-1">{formatFileSize(document.file_size)}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">Uploaded</p>
              <p className="mt-1">{formatDate(document.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="mt-1">{formatDate(document.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {document.audience_type === 'CUSTOM' && (
        <Card>
          <CardHeader>
            <CardTitle>Audience Configuration</CardTitle>
            <CardDescription>This policy is visible to specific employees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {document.allowed_departments && document.allowed_departments.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Allowed Departments</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {document.allowed_departments.map((dept) => (
                    <span
                      key={dept}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {document.allowed_locations && document.allowed_locations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Allowed Locations</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {document.allowed_locations.map((loc) => (
                    <span
                      key={loc}
                      className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded"
                    >
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {document.allowed_employment_types &&
              document.allowed_employment_types.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Allowed Employment Types
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {document.allowed_employment_types.map((type) => (
                      <span
                        key={type}
                        className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
