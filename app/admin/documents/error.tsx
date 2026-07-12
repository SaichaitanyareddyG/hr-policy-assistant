'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function DocumentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error to error reporting service
    console.error('Documents page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Failed to Load Documents
              </h2>
              <p className="text-sm text-gray-600">
                {error.message || 'An unexpected error occurred while loading documents.'}
              </p>
              {process.env.NODE_ENV === 'development' && error.digest && (
                <p className="text-xs text-gray-500 font-mono">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={reset}
                variant="default"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </div>

            <div className="pt-4 border-t w-full">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact your system administrator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
