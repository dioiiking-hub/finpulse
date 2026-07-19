import { useNavigate } from 'react-router'
import { TICKER_ITEMS, fmtChange, fmtPrice } from '@/data/markets'
import type { MarketQuote } from '@/data/markets'
import { cn } from '@/lib/utils'

function TickerItem({ q, onClick }: { q: MarketQuote; onClick: (q: MarketQuote) => void }) {
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
      <span className={cn('tnum font-mono text-xs font-medium', up ? 'text-up' : 'text-down')}>
        {fmtChange(q.changePct)}
      </span>
    </button>
  )
}

/**
 * TickerTape（design.md §6.2）：h-10 marquee 40s 无限循环，hover 暂停。
 * home 页 sticky top-16 使用；markets 页可静态复用（sticky=false）。
 */
export default function TickerTape({ sticky = true }: { sticky?: boolean }) {
  const navigate = useNavigate()
  const go = (q: MarketQuote) => navigate(`/markets#${q.id}`)
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS]
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
            <TickerItem q={q} onClick={go} />
            <span className="select-none px-1 text-[6px] text-gold/30">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}
