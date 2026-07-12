'use client';

import { useState, useEffect } from 'react';
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
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { POLICY_CATEGORIES } from '@/types/documents';
import type { PolicyDocument, AudienceType, DocumentStatus } from '@/types/documents';
import { updatePolicyDocument } from '@/lib/documents/actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditDocumentPage({ params }: PageProps) {
  const router = useRouter();
  const [documentId, setDocumentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [version, setVersion] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [status, setStatus] = useState<DocumentStatus>('ACTIVE');
  const [audienceType, setAudienceType] = useState<AudienceType>('ALL');
  const [departments, setDepartments] = useState('');
  const [locations, setLocations] = useState('');
  const [employmentTypes, setEmploymentTypes] = useState('');

  useEffect(() => {
    params.then(({ id }) => {
      setDocumentId(id);
      fetchDocument(id);
    });
  }, []);

  const fetchDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${id}`);
      const data = await response.json();

      if (data.document) {
        const doc = data.document;
        setTitle(doc.title);
        setDescription(doc.description || '');
        setCategory(doc.category);
        setVersion(doc.version || '');
        setEffectiveDate(doc.effective_date || '');
        setStatus(doc.status);
        setAudienceType(doc.audience_type);
        setDepartments(doc.allowed_departments?.join(', ') || '');
        setLocations(doc.allowed_locations?.join(', ') || '');
        setEmploymentTypes(doc.allowed_employment_types?.join(', ') || '');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Parse array fields for custom audience
      const allowed_departments =
        audienceType === 'CUSTOM'
          ? departments
              .split(',')
              .map((d) => d.trim())
              .filter(Boolean)
          : null;

      const allowed_locations =
        audienceType === 'CUSTOM'
          ? locations
              .split(',')
              .map((l) => l.trim())
              .filter(Boolean)
          : null;

      const allowed_employment_types =
        audienceType === 'CUSTOM'
          ? employmentTypes
              .split(',')
              .map((e) => e.trim())
              .filter(Boolean)
          : null;

      const result = await updatePolicyDocument({
        id: documentId,
        title,
        description,
        category: category as any,
        version,
        effective_date: effectiveDate || undefined,
        status,
        audience_type: audienceType,
        allowed_departments: allowed_departments || undefined,
        allowed_locations: allowed_locations || undefined,
        allowed_employment_types: allowed_employment_types || undefined,
      });

      if (result.success) {
        router.push(`/admin/documents/${documentId}`);
        router.refresh();
      } else {
        setError(result.error || 'Failed to update document');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/documents/${documentId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Policy Metadata</h1>
          <p className="text-gray-500 mt-1">Update document information and settings</p>
        </div>
      </div>

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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
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
                    <SelectValue />
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

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value: DocumentStatus) => setStatus(value)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locations">Allowed Locations (comma-separated)</Label>
                  <Input
                    id="locations"
                    placeholder="e.g., New York, Remote, Bangalore"
                    value={locations}
                    onChange={(e) => setLocations(e.target.value)}
                  />
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
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/documents/${documentId}`)}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
