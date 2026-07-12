import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col h-screen">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* User message */}
        <div className="flex justify-end">
          <Skeleton className="h-20 w-3/4 rounded-lg" />
        </div>
        {/* AI message */}
        <div className="flex justify-start">
          <Skeleton className="h-32 w-3/4 rounded-lg" />
        </div>
        {/* User message */}
        <div className="flex justify-end">
          <Skeleton className="h-16 w-2/3 rounded-lg" />
        </div>
        {/* AI message */}
        <div className="flex justify-start">
          <Skeleton className="h-24 w-3/4 rounded-lg" />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t bg-white px-4 py-4">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  )
}
