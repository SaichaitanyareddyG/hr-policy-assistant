import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm';

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
