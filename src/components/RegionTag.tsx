import { cn } from '@/lib/utils'
import type { Region } from '@/lib/types'

const REGION_COLORS: Record<Region, string> = {
  中国: '#E5484D',
  美国: '#6E9FFF',
  全球: '#9DAAB8',
}

/** RegionTag（design.md §2/§6.4）：中国红 / 美国蓝 / 全球灰 */
export default function RegionTag({ region, className }: { region: Region; className?: string }) {
  const color = REGION_COLORS[region]
  return (
    <span
      className={cn('inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs', className)}
      style={{ backgroundColor: `${color}1A`, color: region === '全球' ? '#9DAAB8' : color }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {region}
    </span>
  )
}
