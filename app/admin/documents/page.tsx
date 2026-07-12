'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Upload, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentTable } from '@/components/documents/DocumentTable';
import { DocumentFiltersComponent } from '@/components/documents/DocumentFilters';
import { EmptyState } from '@/components/documents/EmptyState';
import type { PolicyDocumentWithUploader, DocumentFilters } from '@/types/documents';
import { archivePolicyDocument, deletePolicyDocument } from '@/lib/documents/actions';
import { embedDocumentChunks } from '@/lib/documents/embedding-actions';
import { reprocessPolicyDocument } from '@/lib/processing/process-document';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AdminDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<PolicyDocumentWithUploader[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<PolicyDocumentWithUploader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>({
    category: 'all',
    status: 'all',
    search: '',
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, documents]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/admin/documents');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Set error state to trigger error UI
      setError(error instanceof Error ? error : new Error('Failed to load documents'));
    } finally {
      setLoading(false);
    }
  };

  // Throw error during render to trigger error boundary
  if (error) {
    throw error;
  }

  const applyFilters = () => {
    let filtered = [...documents];

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter((doc) => doc.category === filters.category);
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((doc) => doc.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((doc) =>
        doc.title.toLowerCase().includes(searchLower)
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleView = (doc: PolicyDocumentWithUploader) => {
    router.push(`/admin/documents/${doc.id}`);
  };

  const handleEdit = (doc: PolicyDocumentWithUploader) => {
    router.push(`/admin/documents/${doc.id}/edit`);
  };

  const handleDownload = async (doc: PolicyDocumentWithUploader) => {
    try {
      const response = await fetch('/api/admin/documents/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: doc.file_path }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate download link');
      }
      
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        alert('Failed to generate download link. Please try again.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleArchive = async (doc: PolicyDocumentWithUploader) => {
    if (confirm(`Archive "${doc.title}"? It will no longer be visible to employees.`)) {
      try {
        const result = await archivePolicyDocument(doc.id);
        if (result.success) {
          fetchDocuments();
        } else {
          alert(`Failed to archive: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Archive error:', error);
        alert('Failed to archive document. Please try again.');
      }
    }
  };

  const handleDelete = async (doc: PolicyDocumentWithUploader) => {
    if (
      confirm(
        `Permanently delete "${doc.title}"? This action cannot be undone.\n\nIt's recommended to archive instead.`
      )
    ) {
      try {
        const result = await deletePolicyDocument(doc.id);
        if (result.success) {
          fetchDocuments();
        } else {
          alert(`Failed to delete: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  const handleGenerateEmbeddings = async (doc: PolicyDocumentWithUploader) => {
    const action = doc.has_embeddings ? 'regenerate' : 'generate';
    const confirmMessage = doc.has_embeddings
      ? `Regenerate embeddings for "${doc.title}"? This will overwrite existing embeddings.`
      : `Generate embeddings for "${doc.title}"? This will enable semantic search for this document.`;

    if (confirm(confirmMessage)) {
      try {
        alert(`Generating embeddings for "${doc.title}"...\n\nThis may take a minute. You'll be notified when complete.`);
        
        const result = await embedDocumentChunks(doc.id, doc.has_embeddings);
        
        if (result.success) {
          alert(
            `Successfully embedded ${result.embeddedChunks}/${result.totalChunks} chunks for "${doc.title}"!`
          );
          fetchDocuments();
        } else {
          alert(`Failed to ${action} embeddings: ${result.errors.join(', ')}`);
        }
      } catch (error) {
        console.error('Generate embeddings error:', error);
        alert(`Failed to ${action} embeddings. Please try again.`);
      }
    }
  };

  const handleReprocess = async (doc: PolicyDocumentWithUploader) => {
    if (
      confirm(
        `Reprocess "${doc.title}"? This will re-extract text and recreate chunks.\n\nExisting chunks and embeddings will be replaced.`
      )
    ) {
      try {
        alert(`Reprocessing "${doc.title}"...\n\nThis may take a minute. You'll be notified when complete.`);
        
        const result = await reprocessPolicyDocument(doc.id);
        
        if (result.success) {
          alert(
            `Successfully reprocessed "${doc.title}"!\n\n` +
            `Extracted: ${result.extractedTextLength} characters\n` +
            `Chunks: ${result.chunksCount}`
          );
          fetchDocuments();
        } else {
          alert(`Failed to reprocess: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Reprocess error:', error);
        alert('Failed to reprocess document. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Policy Documents</h1>
          <p className="text-gray-500 mt-1">
            Manage your company policy documents ({documents.length} total)
          </p>
        </div>
        <Link href="/admin/documents/upload">
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </Link>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={FileText}
              title="No documents uploaded yet"
              description="Start by uploading your first policy document to make it available to employees"
              action={{
                label: 'Upload Your First Document',
                href: '/admin/documents/upload',
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <DocumentFiltersComponent
                filters={filters}
                onFiltersChange={setFilters}
                showStatusFilter={true}
              />
            </CardContent>
          </Card>

          <DocumentTable
            documents={filteredDocuments}
            onView={handleView}
            onEdit={handleEdit}
            onDownload={handleDownload}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onGenerateEmbeddings={handleGenerateEmbeddings}
            onReprocess={handleReprocess}
          />
        </>
      )}
    </div>
  );
}
