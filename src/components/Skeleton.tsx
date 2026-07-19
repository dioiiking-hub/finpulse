import { cn } from '@/lib/utils'

/** Skeleton（design.md §6.4）：surface-2→surface-3 1.4s 流光 */
export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer animate-shimmer rounded-md', className)} />
}

/** 热点流列表骨架 */
export function FeedSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4">
          <Skeleton className="h-12 w-14 shrink-0" />
          <div className="flex-1 space-y-2.5 py-1">
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
