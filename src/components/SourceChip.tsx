import { cn } from '@/lib/utils'

/**
 * SourceChip（design.md §6.4）：16px 字母方块（surface-3 底，首字 mono）+ 来源名。
 */
export default function SourceChip({ source, className }: { source: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-text-2', className)}>
      <span className="flex h-4 w-4 items-center justify-center rounded bg-surface-3 font-mono text-[10px] font-medium text-text-1">
        {source.slice(0, 1).toUpperCase()}
      </span>
      {source}
    </span>
  )
}
