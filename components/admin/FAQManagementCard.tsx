/**
 * FAQ Management Card Component
 * 
 * Create, edit, archive FAQs with audience targeting.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createFAQ, updateFAQ, archiveFAQ, type FAQ, type AudienceType } from '@/lib/faq/actions';
import { Plus, Edit, Archive, Check, X, MessageCircleQuestion, Users } from 'lucide-react';

interface FAQManagementCardProps {
  faqs: FAQ[];
}

export function FAQManagementCard({ faqs: initialFAQs }: FAQManagementCardProps) {
  const [faqs, setFaqs] = useState(initialFAQs);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    audienceType: 'ALL' as AudienceType,
    allowedDepartments: '',
    allowedLocations: '',
    allowedEmploymentTypes: '',
  });

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: '',
      audienceType: 'ALL',
      allowedDepartments: '',
      allowedLocations: '',
      allowedEmploymentTypes: '',
    });
    setIsCreating(false);
    setEditingId(null);
    setError(null);
  };

  const handleCreate = async () => {
    setError(null);
    setLoading(true);

    const result = await createFAQ({
      question: formData.question,
      answer: formData.answer,
      category: formData.category || undefined,
      audienceType: formData.audienceType,
      allowedDepartments: formData.allowedDepartments
        ? formData.allowedDepartments.split(',').map((d) => d.trim())
        : undefined,
      allowedLocations: formData.allowedLocations
        ? formData.allowedLocations.split(',').map((l) => l.trim())
        : undefined,
      allowedEmploymentTypes: formData.allowedEmploymentTypes
        ? formData.allowedEmploymentTypes.split(',').map((t) => t.trim())
        : undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to create FAQ');
      return;
    }

    // Add to list
    if (result.faq) {
      setFaqs([result.faq, ...faqs]);
    }

    resetForm();
    window.location.reload(); // Refresh to get updated list
  };

  const handleArchive = async (faqId: string) => {
    if (!confirm('Are you sure you want to archive this FAQ?')) return;

    setLoading(true);
    const result = await archiveFAQ(faqId);
    setLoading(false);

    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error || 'Failed to archive FAQ');
    }
  };

  const activeFAQs = faqs.filter((faq) => faq.status === 'ACTIVE');
  const archivedFAQs = faqs.filter((faq) => faq.status === 'ARCHIVED');

  return (
    <>
      {/* Create FAQ Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {isCreating ? 'Create New FAQ' : 'Quick Actions'}
          </CardTitle>
          <CardDescription>
            {isCreating
              ? 'Add a new HR-approved answer'
              : 'Create FAQs to provide instant answers to common questions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isCreating ? (
            <Button onClick={() => setIsCreating(true)} className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create New FAQ
            </Button>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Question */}
              <div>
                <Label htmlFor="question">
                  Question <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="question"
                  placeholder="What is our remote work policy?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  disabled={loading}
                  className="mt-1.5"
                />
              </div>

              {/* Answer */}
              <div>
                <Label htmlFor="answer">
                  Answer <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="answer"
                  placeholder="Our remote work policy allows..."
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  disabled={loading}
                  rows={4}
                  className="mt-1.5"
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category (optional)</Label>
                <Input
                  id="category"
                  placeholder="Benefits, Leave, Remote Work, etc."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={loading}
                  className="mt-1.5"
                />
              </div>

              {/* Audience Type */}
              <div>
                <Label htmlFor="audienceType">Audience</Label>
                <Select
                  value={formData.audienceType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, audienceType: value as AudienceType })
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Employees</SelectItem>
                    <SelectItem value="RESTRICTED">Specific Groups</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Restricted Audience Fields */}
              {formData.audienceType === 'RESTRICTED' && (
                <>
                  <div>
                    <Label htmlFor="allowedDepartments">
                      Allowed Departments (comma-separated)
                    </Label>
                    <Input
                      id="allowedDepartments"
                      placeholder="Engineering, Sales, Marketing"
                      value={formData.allowedDepartments}
                      onChange={(e) =>
                        setFormData({ ...formData, allowedDepartments: e.target.value })
                      }
                      disabled={loading}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="allowedLocations">
                      Allowed Locations (comma-separated)
                    </Label>
                    <Input
                      id="allowedLocations"
                      placeholder="San Francisco, New York, Remote"
                      value={formData.allowedLocations}
                      onChange={(e) =>
                        setFormData({ ...formData, allowedLocations: e.target.value })
                      }
                      disabled={loading}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="allowedEmploymentTypes">
                      Allowed Employment Types (comma-separated)
                    </Label>
                    <Input
                      id="allowedEmploymentTypes"
                      placeholder="Full-Time, Part-Time, Contract"
                      value={formData.allowedEmploymentTypes}
                      onChange={(e) =>
                        setFormData({ ...formData, allowedEmploymentTypes: e.target.value })
                      }
                      disabled={loading}
                      className="mt-1.5"
                    />
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreate} disabled={loading}>
                  <Check className="w-4 h-4 mr-2" />
                  Create FAQ
                </Button>
                <Button onClick={resetForm} variant="outline" disabled={loading}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircleQuestion className="w-5 h-5" />
            Active FAQs ({activeFAQs.length})
          </CardTitle>
          <CardDescription>Currently shown to employees</CardDescription>
        </CardHeader>
        <CardContent>
          {activeFAQs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageCircleQuestion className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No active FAQs yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeFAQs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {faq.category && (
                          <Badge variant="secondary">{faq.category}</Badge>
                        )}
                        <Badge variant={faq.audienceType === 'ALL' ? 'default' : 'outline'}>
                          <Users className="w-3 h-3 mr-1" />
                          {faq.audienceType === 'ALL' ? 'All Employees' : 'Restricted'}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-sm text-gray-700 line-clamp-3">{faq.answer}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleArchive(faq.id)}
                        disabled={loading}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {faq.audienceType === 'RESTRICTED' && (
                    <div className="text-xs text-gray-500 space-y-1">
                      {faq.allowedDepartments.length > 0 && (
                        <p>Departments: {faq.allowedDepartments.join(', ')}</p>
                      )}
                      {faq.allowedLocations.length > 0 && (
                        <p>Locations: {faq.allowedLocations.join(', ')}</p>
                      )}
                      {faq.allowedEmploymentTypes.length > 0 && (
                        <p>Types: {faq.allowedEmploymentTypes.join(', ')}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archived FAQs */}
      {archivedFAQs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Archived FAQs ({archivedFAQs.length})
            </CardTitle>
            <CardDescription>No longer shown to employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {archivedFAQs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-60"
                >
                  <h4 className="font-medium text-gray-700 mb-1">{faq.question}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
