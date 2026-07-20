import { motion } from 'framer-motion'
import { Bitcoin, Coins, ExternalLink, Package } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fmtChange, fmtPrice } from '@/data/markets'
import { marketLink } from '@/data/marketLinks'
import Sparkline from '@/components/Sparkline'
import { cn } from '@/lib/utils'
import type { AssetQuote } from './data'
import type { FlashMap, LiveQuote } from './useDemoQuotes'
import FlashOverlay from './FlashOverlay'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

function AssetRow({
  q,
  index,
  flash,
  anchored,
}: {
  q: LiveQuote<AssetQuote>
  index: number
  flash?: 'up' | 'down'
  anchored: boolean
}) {
  const up = q.changePct >= 0
  return (
    <motion.a
      href={marketLink(q.id)}
      target="_blank"
      rel="noopener noreferrer"
      title="在数据源查看实时行情"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: EASE }}
      id={q.id}
      className="group relative block scroll-mt-[120px] rounded-lg py-2.5"
    >
      {anchored && <FlashOverlay rounded="rounded-lg" />}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] text-text-2">{q.name}</span>
            {q.badge === '历史新高' && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/15 px-1.5 py-px text-[10px] font-medium text-gold">
                <span className="h-1 w-1 rounded-full bg-gold animate-pulse-dot" />
                历史新高
              </span>
            )}
            {q.badge === '24H' && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-surface-3 px-1.5 py-px font-mono text-[10px] text-text-2">
                24H
              </span>
            )}
          </div>
          {q.note && <p className="mt-0.5 text-[11px] leading-4 text-text-3">{q.note}</p>}
        </div>
        <span
          className={cn(
            'tnum shrink-0 rounded px-1 font-mono text-[13px] font-medium text-text-1 transition-colors duration-200',
            flash === 'up' && 'bg-up/15',
            flash === 'down' && 'bg-down/15',
          )}
        >
          {fmtPrice(q)}
          {q.unit && <span className="ml-0.5 font-sans text-[11px] text-text-3">{q.unit}</span>}
        </span>
        <span className={cn('tnum w-[64px] shrink-0 text-right font-mono text-xs font-medium', up ? 'text-up' : 'text-down')}>
          {fmtChange(q.changePct)}
        </span>
        <span className="hidden w-[60px] shrink-0 sm:block">
          <Sparkline data={q.spark} width={60} height={20} />
        </span>
        <ExternalLink
          size={12}
          aria-hidden
          className="shrink-0 text-text-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:text-gold"
        />
      </div>
    </motion.a>
  )
}

function Panel({
  icon: Icon,
  title,
  sub,
  rows,
  flashes,
  flashId,
  index,
}: {
  icon: LucideIcon
  title: string
  sub: string
  rows: LiveQuote<AssetQuote>[]
  flashes: FlashMap
  flashId: string | null
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: EASE }}
      className="rounded-xl border border-line bg-surface-1 p-5"
    >
      <div className="mb-2 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-gold">
          <Icon size={16} />
        </span>
        <h3 className="text-[15px] font-medium text-text-1">{title}</h3>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-text-3">{sub}</span>
      </div>
      <div className="divide-y divide-line">
        {rows.map((q, i) => (
          <AssetRow key={q.id} q={q} index={i} flash={flashes[q.id]} anchored={flashId === q.id} />
        ))}
      </div>
    </motion.div>
  )
}

/** S4 · 汇率 / 大宗 / 加密 三列行情 */
export default function AssetColumns({
  groups,
  flashes,
  flashId,
}: {
  groups: LiveQuote<AssetQuote>[][]
  flashes: FlashMap
  flashId: string | null
}) {
  const [fx, cmdty, crypto] = groups
  return (
    <section className="py-10">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel icon={Coins} title="汇率" sub="FX" rows={fx} flashes={flashes} flashId={flashId} index={0} />
        <Panel icon={Package} title="大宗商品" sub="Commodities" rows={cmdty} flashes={flashes} flashId={flashId} index={1} />
        <Panel icon={Bitcoin} title="加密货币" sub="Crypto" rows={crypto} flashes={flashes} flashId={flashId} index={2} />
      </div>
    </section>
  )
}
