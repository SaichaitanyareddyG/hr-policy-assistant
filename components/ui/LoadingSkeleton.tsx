/**
 * Loading Skeleton Component
 * 
 * Displays loading placeholders for various content types
 */

import { Skeleton } from '@/components/ui/skeleton';

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border bg-white p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-6">
      {/* User message */}
      <div className="flex gap-3 flex-row-reverse">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 max-w-3xl">
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
      {/* Assistant message */}
      <div className="flex gap-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 max-w-3xl space-y-3">
          <Skeleton className="h-32 rounded-2xl" />
          <div className="flex gap-2">
            <Skeleton className="h-16 w-48 rounded-xl" />
            <Skeleton className="h-16 w-48 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
