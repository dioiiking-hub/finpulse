import { cn } from '@/lib/utils'
import type { FeedStatus } from '@/lib/types'

/**
 * 数据源状态徽标（design.md §2 状态徽标）：
 * LIVE = gold 脉冲点；DEMO = us-blue 常亮点（避免红/绿混淆涨跌）。
 */
export default function DataStatusBadge({
  status,
  className,
}: {
  status: FeedStatus
  className?: string
}) {
  const live = status === 'live'
  const loading = status === 'loading'
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1.5 rounded-full border px-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em]',
        live
          ? 'border-gold/40 bg-gold/10 text-gold'
          : 'border-us-blue/40 bg-us-blue/10 text-us-blue',
        className,
      )}
      title={live ? 'RSS 实时数据' : loading ? '正在连接信源…' : '演示数据（RSS 代理不可用，已降级）'}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          live ? 'bg-gold animate-pulse-dot' : 'bg-us-blue',
        )}
      />
      {loading ? 'SYNC' : live ? 'LIVE' : 'DEMO'}
    </span>
  )
}
