import { useRef } from 'react'
import { Link } from 'react-router'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import WorldMapCanvas from '@/components/WorldMapCanvas'
import CountUp from '@/components/CountUp'
import { getMarketStatuses } from '@/data/markets'
import { useNewsFeed } from '@/lib/feeds'
import { useNow } from '@/lib/useNow'
import { beijingClock, newYorkClock } from '@/lib/time'
import { scrollToId } from '@/lib/scroll'
import { cn } from '@/lib/utils'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

/** 市场状态 chip：交易中=gold 脉冲，盘前=us-blue，午休=gold/50，已收盘=灰 */
function MarketChip({ label, session }: { label: string; session: string }) {
  const dot =
    session === 'open'
      ? 'bg-gold animate-pulse-dot'
      : session === 'pre'
        ? 'bg-us-blue'
        : session === 'break'
          ? 'bg-gold/50'
          : 'bg-text-3'
  const text =
    session === 'open'
      ? '交易中'
      : session === 'pre'
        ? '盘前'
        : session === 'break'
          ? '午休'
          : '已收盘'
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-text-2">
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label} · <span className={cn(session === 'open' && 'text-gold')}>{text}</span>
    </span>
  )
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { items, lastUpdated } = useNewsFeed()
  const now = useNow(1000)
  const d = new Date(now)
  const statuses = getMarketStatuses(d)
  const hotCount = items.filter((i) => i.heat >= 80).length

  // 滚动视差：内容 y+40 透明度→0.3；地图减半
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 40])
  const contentOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])
  const mapY = useTransform(scrollYProgress, [0, 1], [0, 20])

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* 底层：世界点阵地图 + canvas（右侧 62%，向左淡出） */}
      <motion.div
        style={{ y: mapY }}
        className="hero-map-mask absolute inset-y-0 right-0 w-full lg:w-[62%]"
        aria-hidden
      >
        <img
          src="/world-dots.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-fill opacity-90"
          draggable={false}
        />
        <WorldMapCanvas />
      </motion.div>

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative">
        <div className="mx-auto grid min-h-[78vh] max-w-[1440px] grid-cols-1 px-4 md:px-8 lg:grid-cols-12">
          {/* 左：文案区 */}
          <div className="flex flex-col justify-center py-16 lg:col-span-6 lg:py-0 lg:pr-10">
            <motion.p
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold"
            >
              <span className="inline-block h-3 w-0.5 bg-gold" />
              Global Macro Radar · 中美双市场
            </motion.p>

            <h1 className="mt-5 font-display text-[40px] font-bold leading-[48px] tracking-tight text-text-1 md:text-[64px] md:leading-[72px]">
              {['全球财经热点', '一网打尽'].map((line, i) => (
                <span key={line} className="block overflow-hidden">
                  <motion.span
                    initial={{ y: 28, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 + i * 0.09, duration: 0.6, ease: EASE }}
                    className={cn('block', i === 1 && 'gold-text-grad font-black')}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: EASE }}
              className="mt-5 max-w-[440px] text-[15px] leading-7 text-text-2"
            >
              准实时监控中美财经脉搏 —— 12+ 全球信源 · 60 秒轮询 · 热度评分 · AI
              选题引擎，为财经自媒体团队而生。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <button
                type="button"
                onClick={() => scrollToId('feed')}
                className="h-10 rounded-lg bg-gold px-5 text-sm font-medium text-on-gold transition-all duration-150 hover:-translate-y-px hover:bg-gold-hover active:scale-[0.97]"
              >
                进入热点流
              </button>
              <Link
                to="/topics"
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line px-5 text-sm text-text-1 transition-colors duration-150 hover:border-gold/60 hover:text-gold"
              >
                查看今日选题
                <ArrowRight size={15} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5, ease: EASE }}
              className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line pt-6"
            >
              {statuses.map((s) => (
                <MarketChip key={s.key} label={s.key} session={s.session} />
              ))}
              <span className="hidden h-3 w-px bg-line sm:block" />
              <span className="tnum font-mono text-[28px] font-bold leading-none text-text-1">
                北京 {beijingClock(d)}
              </span>
              <span className="tnum font-mono text-base text-text-3">纽约 {newYorkClock(d)}</span>
            </motion.div>
          </div>
        </div>

        {/* 统计条 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5, ease: EASE }}
          className="mx-auto max-w-[1440px] px-4 md:px-8"
        >
          <div className="grid grid-cols-2 gap-y-4 border-t border-line py-5 md:grid-cols-4">
            {[
              { label: '今日热点', value: <CountUp value={Math.max(items.length, 36)} duration={1} className="tnum" />, tip: '聚合全部信源的当日热点条目数' },
              { label: '高热(≥80)', value: <CountUp value={hotCount} duration={1} className="tnum" />, tip: '高热 = 热度分 ≥ 80' },
              { label: '覆盖信源', value: <CountUp value={12} duration={1} className="tnum" />, tip: '中英文 RSS 信源数量' },
              {
                label: '最近更新',
                value: (
                  <span className="tnum">{beijingClock(new Date(lastUpdated))}</span>
                ),
                tip: '60 秒轮询，点击导航栏倒计时环可立即刷新',
              },
            ].map((s) => (
              <div key={s.label} title={s.tip} className="cursor-default">
                <div className="font-mono text-2xl font-bold text-text-1">{s.value}</div>
                <div className="mt-1 text-xs text-text-3">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
