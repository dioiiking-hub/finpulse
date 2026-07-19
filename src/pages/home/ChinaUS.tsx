import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { CN_BOARD, US_BOARD, fmtChange, fmtPrice } from '@/data/markets'
import type { MarketQuote } from '@/data/markets'
import { overlayQuotes, useMarketSnapshot } from '@/lib/marketSnapshot'
import RegionTag from '@/components/RegionTag'
import Sparkline from '@/components/Sparkline'
import SectionHeader from '@/components/SectionHeader'
import { cn } from '@/lib/utils'
import type { Region } from '@/lib/types'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

function IndexRow({ q, onClick, index }: { q: MarketQuote; onClick: () => void; index: number }) {
  const up = q.changePct >= 0
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: EASE }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-surface-2"
      title="点击查看市场速览"
    >
      <span className="w-24 shrink-0 text-[13px] text-text-2">{q.name}</span>
      <span className="tnum w-24 shrink-0 font-mono text-sm font-medium text-text-1">{fmtPrice(q)}</span>
      <span
        className={cn(
          'tnum inline-flex w-[68px] shrink-0 justify-center rounded-full px-2 py-0.5 font-mono text-xs font-medium',
          up ? 'bg-up/[0.12] text-up' : 'bg-down/[0.12] text-down',
        )}
      >
        {fmtChange(q.changePct)}
      </span>
      <span className="ml-auto hidden sm:block">
        <Sparkline data={q.spark} width={96} height={28} />
      </span>
    </motion.button>
  )
}

function Board({
  region,
  title,
  quotes,
  headline,
  fromX,
}: {
  region: Region
  title: string
  quotes: MarketQuote[]
  headline: string
  fromX: number
}) {
  const navigate = useNavigate()
  return (
    <motion.div
      initial={{ opacity: 0, x: fromX }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="rounded-xl border border-line bg-surface-1 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lift"
    >
      <div className="mb-4 flex items-center gap-3">
        <RegionTag region={region} />
        <h3 className="text-[17px] font-medium text-text-1">{title}</h3>
      </div>
      <div className="divide-y divide-line">
        {quotes.map((q, i) => (
          <IndexRow key={q.id} q={q} index={i} onClick={() => navigate(`/markets#${q.id}`)} />
        ))}
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <p className="text-sm leading-6 text-text-2">
          <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.12em] text-gold">今日头条</span>
          {headline}
        </p>
      </div>
    </motion.div>
  )
}

/** S4 · 中美瞭望（行情快照可用时叠加真实值，否则回退演示数据） */
export default function ChinaUS() {
  const { quotes: snapshot } = useMarketSnapshot()
  const cnBoard = useMemo(() => overlayQuotes(CN_BOARD, snapshot), [snapshot])
  const usBoard = useMemo(() => overlayQuotes(US_BOARD, snapshot), [snapshot])
  return (
    <section className="noise-bg border-y border-line bg-bg-1 py-24">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <SectionHeader tag="CHINA × U.S." title="中美瞭望" desc="双市场联动，一屏对照" />
        <div className="relative grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* VS 徽章 */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.2 }}
            className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
          >
            <div className="animate-pulse-dot flex h-8 w-12 items-center justify-center rounded-full border border-gold bg-bg-1 font-display text-xs font-bold tracking-widest text-gold">
              VS
            </div>
          </motion.div>
          <Board
            region="中国"
            title="A股 · 港股"
            quotes={cnBoard}
            headline="沪指放量收涨 0.82%，两市成交额重返万亿，北向资金连续五日净流入"
            fromX={-40}
          />
          <Board
            region="美国"
            title="美股"
            quotes={usBoard}
            headline="英伟达营收再超预期，纳指站上 25,000 点，「降息交易」全线升温"
            fromX={40}
          />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mx-auto mt-10 max-w-[720px] border-l-2 border-gold pl-4 font-mono text-[13px] leading-6 text-text-2"
        >
          隔夜纳指 +1.18%、费半 +2.31% → 关注今日 A 股半导体与 AI 算力板块联动机会
        </motion.p>
      </div>
    </section>
  )
}
