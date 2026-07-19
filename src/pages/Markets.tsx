import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { motion } from 'framer-motion'
import TickerTape from '@/components/TickerTape'
import { overlayQuotes, useMarketSnapshot } from '@/lib/marketSnapshot'
import StatusBand from '@/pages/markets/StatusBand'
import IndexCards from '@/pages/markets/IndexCards'
import type { BoardTab } from '@/pages/markets/IndexCards'
import CompareChart from '@/pages/markets/CompareChart'
import AssetColumns from '@/pages/markets/AssetColumns'
import EconCalendar from '@/pages/markets/EconCalendar'
import LinkageInsights from '@/pages/markets/LinkageInsights'
import { useDemoQuotes } from '@/pages/markets/useDemoQuotes'
import type { LiveQuote } from '@/pages/markets/useDemoQuotes'
import { CN_CARDS, CMDTY_ROWS, CRYPTO_ROWS, FX_ROWS, GLOBAL_CARDS, US_CARDS } from '@/pages/markets/data'
import type { AssetQuote, BoardQuote } from '@/pages/markets/data'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

/**
 * 市场速览 `/markets`（markets.md）：
 * S1 页头+开收盘状态带 / S2 指数卡片 / S3 中美对比大图 /
 * S4 汇率大宗加密 / S5 财经日历 / S6 中美联动观察。
 */
export default function Markets() {
  // 真实行情快照：可用时按 id 叠加到本地演示组（price/changePct/spark 用快照值），失败回退演示数据
  const { quotes: snapshot } = useMarketSnapshot()
  const baseGroups = useMemo(
    () =>
      [CN_CARDS, US_CARDS, GLOBAL_CARDS, FX_ROWS, CMDTY_ROWS, CRYPTO_ROWS].map(
        (g: (BoardQuote | AssetQuote)[]) => overlayQuotes(g, snapshot),
      ),
    [snapshot],
  )
  const { groups, flashes } = useDemoQuotes<BoardQuote | AssetQuote>(baseGroups)
  const boards = groups.slice(0, 3) as LiveQuote<BoardQuote>[][]
  const assets = groups.slice(3) as LiveQuote<AssetQuote>[][]

  const [tab, setTab] = useState<BoardTab>('中国')
  const [flashId, setFlashId] = useState<string | null>(null)
  const location = useLocation()
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // TickerTape / 中美瞭望 跳入 `/markets#<id>`：切 tab → 滚动定位 → 金色闪烁 1.2s
  useEffect(() => {
    const id = location.hash.slice(1)
    if (!id) return
    const targetTab: BoardTab | null = US_CARDS.some((q) => q.id === id)
      ? '美国'
      : GLOBAL_CARDS.some((q) => q.id === id)
        ? '全球其他'
        : CN_CARDS.some((q) => q.id === id)
          ? '中国'
          : null

    const delays = [160, 420, 800]
    const attempt = (k: number) => {
      const el = document.getElementById(id)
      if (!el) {
        if (k < delays.length) timers.current.push(setTimeout(() => attempt(k + 1), delays[k]))
        return
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setFlashId(id)
      timers.current.push(setTimeout(() => setFlashId(null), 1500))
    }
    // 先（异步）切换到目标 tab，等 AnimatePresence 重排完成后再滚动定位
    timers.current.push(
      setTimeout(() => {
        if (targetTab) setTab(targetTab)
        attempt(0)
      }, 60),
    )
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [location.hash])

  return (
    <>
      {/* 顶部静态 TickerTape 一行（design.md §6.2 markets 复用） */}
      <TickerTape sticky={false} />

      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        {/* S1 · 页头 + 全球开收盘状态带 */}
        <section className="pb-6 pt-16">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold"
          >
            <span className="inline-block h-3 w-0.5 bg-gold" />
            MARKET SNAPSHOT · 中美双市场
          </motion.p>
          <h1 aria-label="市场速览" className="mt-3 text-3xl font-black leading-[38px] text-text-1 md:text-[40px] md:leading-[48px]">
            {'市场速览'.split('').map((ch, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="inline-block"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.5, ease: EASE }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45, ease: EASE }}
            className="mt-3 max-w-[560px] text-sm leading-6 text-text-2"
          >
            指数、汇率、大宗与财经日历 —— 选题的盘面背景板。
          </motion.p>
          <StatusBand />
        </section>

        {/* S2 · 指数卡片区 */}
        <IndexCards boards={boards} flashes={flashes} tab={tab} onTabChange={setTab} flashId={flashId} />
      </div>

      {/* S3 · 中美对比大图 */}
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <CompareChart />
      </div>

      {/* S4 · 汇率 / 大宗 / 加密 */}
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <AssetColumns groups={assets} flashes={flashes} flashId={flashId} />
      </div>

      {/* S5 · 财经日历（全宽 bg-1 + noise） */}
      <EconCalendar />

      {/* S6 · 中美联动观察 */}
      <LinkageInsights />
    </>
  )
}
