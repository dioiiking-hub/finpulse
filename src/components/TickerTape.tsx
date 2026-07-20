import { useNavigate } from 'react-router'
import { TICKER_ITEMS, fmtChange, fmtPrice } from '@/data/markets'
import type { MarketQuote } from '@/data/markets'
import { snapshotClock, snapshotSourcesLabel, useMarketSnapshot } from '@/lib/marketSnapshot'
import { cn } from '@/lib/utils'

function TickerItem({
  q,
  snapClock,
  snapTip,
  onClick,
}: {
  q: MarketQuote
  /** 快照可用时的北京 HH:MM（空串 = 演示行情，不显示提示） */
  snapClock: string
  /** hover tooltip：快照 14:30 · iFinD/Yahoo Finance */
  snapTip: string
  onClick: (q: MarketQuote) => void
}) {
  const up = q.changePct >= 0
  return (
    <button
      type="button"
      onClick={() => onClick(q)}
      className="group flex shrink-0 items-center gap-2 px-4 py-1 transition-colors hover:bg-surface-2"
      title={`${q.name} · 点击查看市场速览`}
    >
      <span className="text-xs text-text-2 group-hover:text-text-1">{q.name}</span>
      <span className="tnum font-mono text-xs text-text-1">{fmtPrice(q)}</span>
      {snapClock && (
        <span className="tnum font-mono text-[10px] text-text-3" title={snapTip}>
          {snapClock}
        </span>
      )}
      <span className={cn('tnum font-mono text-xs font-medium', up ? 'text-up' : 'text-down')}>
        {fmtChange(q.changePct)}
      </span>
    </button>
  )
}

/**
 * TickerTape（design.md §6.2）：h-10 marquee 40s 无限循环，hover 暂停。
 * home 页 sticky top-16 使用；markets 页可静态复用（sticky=false）。
 * 行情快照可用时用快照值渲染，价格旁附快照时间提示；否则回退演示数据。
 */
export default function TickerTape({ sticky = true }: { sticky?: boolean }) {
  const navigate = useNavigate()
  const { quotes, asOf, sources } = useMarketSnapshot()
  const items = quotes ?? TICKER_ITEMS
  const snapClock = quotes ? snapshotClock(asOf) : ''
  const snapTip = snapClock ? `快照 ${snapClock} · ${snapshotSourcesLabel(sources)}` : ''
  const go = (q: MarketQuote) => navigate(`/markets#${q.id}`)
  const doubled = [...items, ...items]
  return (
    <div
      className={cn(
        'h-10 overflow-hidden border-y border-line bg-bg-0',
        sticky && 'sticky top-16 z-30',
      )}
    >
      <div className="flex h-full w-max items-center animate-marquee hover:[animation-play-state:paused]">
        {doubled.map((q, i) => (
          <span key={`${q.id}-${i}`} className="flex shrink-0 items-center">
            <TickerItem q={q} snapClock={snapClock} snapTip={snapTip} onClick={go} />
            <span className="select-none px-1 text-[6px] text-gold/30">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}
