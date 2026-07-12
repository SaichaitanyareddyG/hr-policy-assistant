'use client';

import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DocumentFiltersComponent } from '@/components/documents/DocumentFilters';
import { PolicyCard } from '@/components/documents/PolicyCard';
import { EmptyState } from '@/components/documents/EmptyState';
import type { PolicyDocument, DocumentFilters } from '@/types/documents';

export default function EmployeePoliciesPage() {
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DocumentFilters>({
    category: 'all',
    search: '',
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, policies]);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/employee/policies');
      const data = await response.json();
      setPolicies(data.policies || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...policies];

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter((doc) => doc.category === filters.category);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchLower) ||
          doc.description?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPolicies(filtered);
  };

  const handleView = async (document: PolicyDocument) => {
    try {
      const response = await fetch('/api/admin/documents/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: document.file_path }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.open(data.url, '_blank');
        }
      }
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  const handleDownload = async (document: PolicyDocument) => {
    try {
      const response = await fetch('/api/admin/documents/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: document.file_path }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          // Create a temporary anchor element to trigger download
          const link = window.document.createElement('a');
          link.href = data.url;
          link.download = document.file_name;
          window.document.body.appendChild(link);
          link.click();
          window.document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading policies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Policy Documents</h1>
        <p className="text-gray-500 mt-1">
          Browse and search through company policy documents ({policies.length} available)
        </p>
      </div>

      {policies.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={FileText}
              title="No policies available yet"
              description="Policy documents will appear here once uploaded by your HR team"
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
                showStatusFilter={false}
              />
            </CardContent>
          </Card>

          {filteredPolicies.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={FileText}
                  title="No matching policies found"
                  description="Try adjusting your search or filters"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPolicies.map((policy) => (
                <PolicyCard
                  key={policy.id}
                  document={policy}
                  onView={handleView}
                  onDownload={handleDownload}
                  showStatus={false}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
