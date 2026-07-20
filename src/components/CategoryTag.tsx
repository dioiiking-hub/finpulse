import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'
import { CATEGORY_COLORS, CATEGORY_SHORT } from '@/lib/types'

/**
 * CategoryTag（design.md §6.4）：6px 彩点 + 12px 文字 + 10% 分类色底。
 */
export default function CategoryTag({
  category,
  short = false,
  className,
}: {
  category: Category
  short?: boolean
  className?: string
}) {
  const color = CATEGORY_COLORS[category]
  return (
    <span
      className={cn('inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs', className)}
      style={{ backgroundColor: `${color}1A`, color: '#9DAAB8' }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {short ? CATEGORY_SHORT[category] : category}
    </span>
  )
}
