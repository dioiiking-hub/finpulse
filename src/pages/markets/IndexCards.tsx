import { AnimatePresence, motion } from 'framer-motion'
import { fmtChange, fmtPrice } from '@/data/markets'
import CountUp from '@/components/CountUp'
import SegmentedTabs from '@/components/SegmentedTabs'
import Sparkline from '@/components/Sparkline'
import { beijingClock } from '@/lib/time'
import { snapshotClock, snapshotSourcesLabel, useMarketSnapshot } from '@/lib/marketSnapshot'
import { useNow } from '@/lib/useNow'
import { cn } from '@/lib/utils'
import { deriveOhlc } from './data'
import type { BoardQuote } from './data'
import type { FlashMap, LiveQuote } from './useDemoQuotes'
import FlashOverlay from './FlashOverlay'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

export type BoardTab = '中国' | '美国' | '全球其他'

function UpdatedStamp() {
  const now = useNow(1000)
  const { quotes, asOf, sources } = useMarketSnapshot()
  const snapClock = quotes ? snapshotClock(asOf) : ''
  // 快照可用：快照 HH:MM · iFinD/Yahoo Finance；否则维持演示行情标注
  if (snapClock) {
    return (
      <p
        className="shrink-0 font-mono text-xs text-text-3"
        title={`行情快照 ${asOf ?? ''} · 30 分钟重取 · 来源 ${snapshotSourcesLabel(sources)}`}
      >
        快照 <span className="tnum">{snapClock}</span> · {snapshotSourcesLabel(sources)}
      </p>
    )
  }
  return (
    <p className="shrink-0 font-mono text-xs text-text-3">
      更新于 <span className="tnum">{beijingClock(new Date(now))}</span> · 演示行情
    </p>
  )
}

function IndexCard({
  q,
  index,
  flash,
  anchored,
}: {
  q: LiveQuote<BoardQuote>
  index: number
  flash?: 'up' | 'down'
  anchored: boolean
}) {
  const up = q.changePct >= 0
  const chg = q.price - q.prevClose
  const ohlc = deriveOhlc(q, q.prevClose)
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: EASE }}
      id={q.id}
      className="group relative scroll-mt-[120px] rounded-xl border border-line bg-surface-1 p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lift"
    >
      {anchored && <FlashOverlay />}
      {/* 顶行：名称 + 交易所 · Sparkline */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-medium text-text-1">{q.name}</h3>
          <p className="mt-0.5 font-mono text-[11px] text-text-3">{q.sub}</p>
        </div>
        <Sparkline data={q.spark} width={96} height={28} className="shrink-0" />
      </div>
      {/* 大数字（tick 时底色红/绿闪烁 200ms） */}
      <p
        className={cn(
          'mt-3 w-fit rounded px-1 -mx-1 transition-colors duration-200',
          flash === 'up' && 'bg-up/15',
          flash === 'down' && 'bg-down/15',
        )}
      >
        <CountUp
          value={q.price}
          decimals={q.decimals}
          className="tnum font-mono text-[28px] font-bold leading-[1.2] text-text-1"
        />
      </p>
      {/* 涨跌行 */}
      <div className="mt-1.5 flex items-center gap-2">
        <span className={cn('tnum font-mono text-[13px] font-medium', up ? 'text-up' : 'text-down')}>
          {chg >= 0 ? '+' : ''}
          {chg.toFixed(q.decimals)}
        </span>
        <span
          className={cn(
            'tnum inline-flex justify-center rounded-full px-2 py-0.5 font-mono text-[13px] font-medium',
            up ? 'bg-up/[0.12] text-up' : 'bg-down/[0.12] text-down',
          )}
        >
          {fmtChange(q.changePct)}
        </span>
      </div>
      {/* 反向指标注释（VIX） */}
      {q.note && <p className="mt-2 text-[11px] leading-4 text-text-3">{q.note}</p>}
      {/* 底行 OHLC：hover 从 0 高度展开 200ms */}
      <div className="max-h-0 overflow-hidden border-t border-transparent transition-all duration-200 group-hover:mt-3 group-hover:max-h-12 group-hover:border-line group-hover:pt-2.5">
        <p className="tnum whitespace-nowrap font-mono text-[11px] text-text-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          今开 {fmtPrice({ price: ohlc.open, decimals: q.decimals })} · 最高{' '}
          {fmtPrice({ price: ohlc.high, decimals: q.decimals })} · 最低{' '}
          {fmtPrice({ price: ohlc.low, decimals: q.decimals })} · 昨收{' '}
          {fmtPrice({ price: ohlc.prevClose, decimals: q.decimals })}
        </p>
      </div>
    </motion.div>
  )
}

/** S2 · 指数卡片区（中国 / 美国 / 全球其他 Tab） */
export default function IndexCards({
  boards,
  flashes,
  tab,
  onTabChange,
  flashId,
}: {
  boards: LiveQuote<BoardQuote>[][]
  flashes: FlashMap
  tab: BoardTab
  onTabChange: (t: BoardTab) => void
  flashId: string | null
}) {
  const tabs: BoardTab[] = ['中国', '美国', '全球其他']
  const active = boards[tabs.indexOf(tab)] ?? boards[0]
  return (
    <section className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs<BoardTab>
          options={tabs.map((v) => ({ value: v, label: v }))}
          value={tab}
          onChange={onTabChange}
          layoutId="markets-board-tab"
        />
        <UpdatedStamp />
      </div>
      <div className="mt-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {active.map((q, i) => (
              <IndexCard key={q.id} q={q} index={i} flash={flashes[q.id]} anchored={flashId === q.id} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
