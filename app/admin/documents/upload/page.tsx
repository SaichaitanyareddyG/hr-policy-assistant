/**
 * Document Upload Page
 * 
 * Optimized with lazy loading for DocumentUploadForm (341 lines)
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load heavy upload form component
// Dynamic import provides code splitting without blocking initial page load
const DocumentUploadForm = dynamic(
  () => import('@/components/documents/DocumentUploadForm').then(mod => ({ default: mod.DocumentUploadForm })),
  {
    loading: () => (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm text-gray-600">Loading upload form...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
  }
);

export default function UploadDocumentPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Policy Document</h1>
        <p className="text-gray-500 mt-1">
          Add a new policy document and configure its settings
        </p>
      </div>

      <DocumentUploadForm />
    </div>
  );
}
