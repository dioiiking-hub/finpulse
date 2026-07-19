import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { Category, NewsItem } from '@/lib/types'
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_SHORT } from '@/lib/types'
import { useNewsFeed } from '@/lib/feeds'
import { useNow } from '@/lib/useNow'
import { beijingClock } from '@/lib/time'
import { cn } from '@/lib/utils'
import SentimentGauge from '@/components/SentimentGauge'
import { heatColor } from '@/components/HeatBadge'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={cn('rounded-xl border border-line bg-surface-1 p-5', className)}
    >
      {children}
    </motion.div>
  )
}

const RANK_COLORS = ['#D8A94E', '#C0C8D2', '#C7824F']

/** 伪随机排名变化（由 id 稳定推导） */
function rankDelta(id: string): { label: string; cls: string } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997
  const r = h % 10
  if (r < 2) return { label: 'NEW', cls: 'text-gold' }
  if (r < 6) return { label: `↑${(h % 3) + 1}`, cls: 'text-up' }
  return { label: `↓${(h % 2) + 1}`, cls: 'text-down' }
}

/* ---------- S3b 热度榜 TOP 10 ---------- */
export function TopHeatList({ onPick }: { onPick: (item: NewsItem) => void }) {
  const { items } = useNewsFeed()
  const now = useNow(60_000)
  const top = [...items].sort((a, b) => b.heat - a.heat).slice(0, 10)
  return (
    <Card>
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[17px] font-medium text-text-1">热度榜</h3>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-3">TOP 10</span>
        </div>
        <span className="tnum font-mono text-xs text-text-3">更新于 {beijingClock(new Date(now), false)}</span>
      </div>
      <div className="divide-y divide-line">
        {top.map((item, i) => {
          const delta = rankDelta(item.id)
          return (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35, ease: EASE }}
              onClick={() => onPick(item)}
              className="group flex w-full items-center gap-3 py-2.5 text-left"
              title="点击定位到热点流"
            >
              <span
                className="tnum w-5 shrink-0 text-center font-mono text-base font-bold"
                style={{ color: RANK_COLORS[i] ?? '#5F7183' }}
              >
                {i + 1}
              </span>
              <span className="line-clamp-2 flex-1 text-[13px] leading-5 text-text-2 transition-colors group-hover:text-text-1">
                {item.title}
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="flex items-center gap-1.5">
                  <span className="tnum font-mono text-xs font-bold" style={{ color: heatColor(item.heat) }}>
                    {item.heat}
                  </span>
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.2 + i * 0.06 }}
                    className={cn('tnum font-mono text-[11px]', delta.cls)}
                  >
                    {delta.label}
                  </motion.span>
                </span>
                <span className="h-0.5 w-12 overflow-hidden rounded-full bg-surface-3">
                  <motion.span
                    className="block h-full rounded-full"
                    style={{ background: heatColor(item.heat) }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.heat}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: i * 0.06, ease: EASE }}
                  />
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </Card>
  )
}

/* ---------- S3c 市场情绪仪 ---------- */
export function SentimentCard() {
  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-[17px] font-medium text-text-1">市场情绪仪</h3>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-3">SENTIMENT</span>
      </div>
      <SentimentGauge value={64} />
      <div className="mt-4 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center">
        {[
          { k: '涨跌家数比', v: '1.8:1', cls: 'text-text-1' },
          { k: '北向资金', v: '+62.4亿', cls: 'text-up' },
          { k: '两市成交', v: '1.02万亿', cls: 'text-text-1' },
        ].map((m, i) => (
          <motion.div
            key={m.k}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease: EASE }}
          >
            <div className={cn('tnum font-mono text-sm font-bold', m.cls)}>{m.v}</div>
            <div className="mt-1 text-[11px] text-text-3">{m.k}</div>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}

/* ---------- S3d 分类热度分布 ---------- */
export function CategoryDistribution({
  active,
  onToggle,
}: {
  active: '全部' | Category
  onToggle: (c: '全部' | Category) => void
}) {
  const { items } = useNewsFeed()
  const counts = CATEGORIES.map((c) => ({ c, n: items.filter((i) => i.category === c).length }))
  const max = Math.max(1, ...counts.map((x) => x.n))
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[17px] font-medium text-text-1">分类热度分布</h3>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-3">7 CATS</span>
      </div>
      <div className="space-y-2.5">
        {counts.map(({ c, n }, i) => {
          const color = CATEGORY_COLORS[c]
          const isActive = active === c
          return (
            <button
              key={c}
              type="button"
              onClick={() => onToggle(isActive ? '全部' : c)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors',
                isActive ? 'bg-surface-3' : 'hover:bg-surface-2',
              )}
              title={isActive ? '点击取消筛选' : '点击按该分类筛选热点流'}
            >
              <span className={cn('w-14 shrink-0 text-xs', isActive ? 'text-text-1' : 'text-text-2')}>
                {CATEGORY_SHORT[c]}
              </span>
              <span className="relative h-4 flex-1 overflow-hidden rounded bg-surface-3/60">
                <motion.span
                  className="block h-full rounded"
                  style={{ background: `${color}${isActive ? '' : 'B3'}` }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(n / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.07, ease: EASE }}
                />
              </span>
              <span className="tnum w-6 shrink-0 text-right font-mono text-xs font-bold text-text-1">{n}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

/* ---------- S3e 团队正在关注 ---------- */
const TEAM_ACTIVITY = [
  { name: '李编辑', color: '#D8A94E', action: '认领了选题《美联储降息预期重燃》', time: '5分钟前' },
  { name: '王主笔', color: '#C7824F', action: '收藏了 黄金新高 热点', time: '12分钟前' },
  { name: '陈运营', color: '#9B8CF2', action: '将《英伟达财报》标记为 短视频优先', time: '18分钟前' },
]

export function TeamActivity() {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[17px] font-medium text-text-1">团队正在关注</h3>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-3">TEAM</span>
      </div>
      <div className="space-y-3">
        {TEAM_ACTIVITY.map((a, i) => (
          <motion.div
            key={a.name}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.35, ease: EASE }}
            className="flex items-start gap-2.5"
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium"
              style={{ borderColor: a.color, color: a.color }}
            >
              {a.name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-5 text-text-2">
                <span className="text-text-1">{a.name}</span> {a.action}
              </p>
              <p className="tnum mt-0.5 font-mono text-[11px] text-text-3">{a.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}

/* ---------- 侧栏组合 ---------- */
export default function Sidebar({
  category,
  onCategoryChange,
  onPickItem,
}: {
  category: '全部' | Category
  onCategoryChange: (c: '全部' | Category) => void
  onPickItem: (item: NewsItem) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <TopHeatList onPick={onPickItem} />
      <SentimentCard />
      <CategoryDistribution active={category} onToggle={onCategoryChange} />
      <TeamActivity />
    </div>
  )
}
