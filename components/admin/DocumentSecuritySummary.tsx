/**
 * Document Security Summary Component
 * 
 * Shows document access and security summary.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Lock, Users, Archive, Clock, AlertCircle } from 'lucide-react';

interface DocumentSecuritySummaryProps {
  stats: {
    total: number;
    restricted: number;
    allEmployee: number;
    archived: number;
    processing: number;
    failed: number;
  };
}

export function DocumentSecuritySummary({ stats }: DocumentSecuritySummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Document Access Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">Total Documents</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>

          <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-orange-600" />
              <p className="text-sm font-medium text-orange-900">Restricted Access</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.restricted}</p>
          </div>

          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-600" />
              <p className="text-sm font-medium text-green-900">All Employees</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.allEmployee}</p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Archive className="w-4 h-4 text-gray-600" />
              <p className="text-sm font-medium text-gray-900">Archived</p>
            </div>
            <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
          </div>

          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-900">Processing</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.processing}</p>
          </div>

          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm font-medium text-red-900">Failed</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          </div>
        </div>

        {stats.failed > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">
              ⚠️ {stats.failed} document{stats.failed > 1 ? 's' : ''} failed processing. 
              Check the Documents page for details.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
