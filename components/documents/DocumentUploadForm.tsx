'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { POLICY_CATEGORIES } from '@/types/documents';
import type { AudienceType } from '@/types/documents';
import { createPolicyDocument } from '@/lib/documents/actions';
import { MAX_FILE_SIZE, formatFileSize } from '@/lib/documents/validation';

export function DocumentUploadForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [audienceType, setAudienceType] = useState<AudienceType>('ALL');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [version, setVersion] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [departments, setDepartments] = useState('');
  const [locations, setLocations] = useState('');
  const [employmentTypes, setEmploymentTypes] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('version', version);
      formData.append('effective_date', effectiveDate);
      formData.append('audience_type', audienceType);

      if (file) {
        formData.append('file', file);
      }

      // Parse and append array fields for custom audience
      if (audienceType === 'CUSTOM') {
        const deptArray = departments
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean);
        const locArray = locations
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean);
        const empArray = employmentTypes
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean);

        formData.append('allowed_departments', JSON.stringify(deptArray));
        formData.append('allowed_locations', JSON.stringify(locArray));
        formData.append('allowed_employment_types', JSON.stringify(empArray));
      }

      const result = await createPolicyDocument(formData);

      console.log('Upload result:', result);

      if (!result) {
        setError('Server did not return a response. Please try again.');
        return;
      }

      if (result.success) {
        router.push('/admin/documents');
        router.refresh();
      } else {
        setError(result.error || 'Failed to upload document');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Policy Information</CardTitle>
          <CardDescription>Basic details about the policy document</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Policy Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Leave Policy 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this policy document"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {POLICY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                placeholder="e.g., 1.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective_date">Effective Date</Label>
              <Input
                id="effective_date"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
          <CardDescription>Upload the PDF file (Max 10MB)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!file ? (
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF only (Max 10MB)</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  required
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audience Settings</CardTitle>
          <CardDescription>Define who can access this policy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="audience_type">Audience Type</Label>
            <Select
              value={audienceType}
              onValueChange={(value: AudienceType) => setAudienceType(value)}
            >
              <SelectTrigger id="audience_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Employees</SelectItem>
                <SelectItem value="CUSTOM">Custom Audience</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {audienceType === 'CUSTOM' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="departments">
                  Allowed Departments (comma-separated)
                </Label>
                <Input
                  id="departments"
                  placeholder="e.g., Engineering, Sales, Marketing"
                  value={departments}
                  onChange={(e) => setDepartments(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Leave empty to allow all departments
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locations">Allowed Locations (comma-separated)</Label>
                <Input
                  id="locations"
                  placeholder="e.g., New York, Remote, Bangalore"
                  value={locations}
                  onChange={(e) => setLocations(e.target.value)}
                />
                <p className="text-xs text-gray-500">Leave empty to allow all locations</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_types">
                  Allowed Employment Types (comma-separated)
                </Label>
                <Input
                  id="employment_types"
                  placeholder="e.g., Full-time, Part-time, Contractor"
                  value={employmentTypes}
                  onChange={(e) => setEmploymentTypes(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Leave empty to allow all employment types
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Policy Document'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/documents')}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
