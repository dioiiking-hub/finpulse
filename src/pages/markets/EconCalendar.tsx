import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion, useScroll } from 'framer-motion'
import { Star, Zap } from 'lucide-react'
import RegionTag from '@/components/RegionTag'
import SegmentedTabs from '@/components/SegmentedTabs'
import { cn } from '@/lib/utils'
import { CAL_EVENTS } from './data'
import type { CalEvent } from './data'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

type RegionFilter = '全部' | '中国' | '美国'

/** 倒计时 chip：以北京墙钟推算距离事件发生的整日数 */
function tMinus(ev: CalEvent, now: Date): string {
  const bj = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60_000)
  const add = (ev.weekday - bj.getDay() + 7) % 7
  const [hh, mm] = ev.time.split(':').map(Number)
  const passed = add === 0 && bj.getHours() * 60 + bj.getMinutes() >= hh * 60 + mm
  const days = passed ? 7 : add
  if (days === 0) return 'T-今天'
  if (days === 1) return 'T-明天'
  return `T-${days}天`
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`重要性 ${n} 星`}>
      {[0, 1, 2].map((i) => (
        <Star key={i} size={11} className={i < n ? 'fill-gold text-gold' : 'text-text-3'} />
      ))}
    </span>
  )
}

/** 「选题预警」小丸：tooltip + 点击跳 /topics 并应用「宏观政策」筛选 */
function AlertPill() {
  return (
    <span className="group/pill relative">
      <Link
        to={`/topics?category=${encodeURIComponent('宏观政策')}`}
        className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium text-gold transition-colors hover:bg-gold/25"
      >
        <Zap size={10} />
        选题预警
      </Link>
      <span className="pointer-events-none absolute -top-8 right-0 z-20 whitespace-nowrap rounded-md border border-line bg-surface-2 px-2 py-1 text-[10px] text-text-2 opacity-0 shadow-lift transition-opacity duration-150 group-hover/pill:opacity-100">
        高热事件，建议提前 2 小时备稿
      </span>
    </span>
  )
}

function EventCard({ ev, index }: { ev: CalEvent; index: number }) {
  const hot = ev.stars === 3
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '0px 0px -15% 0px' }}
      transition={{ delay: index * 0.1, duration: 0.45, ease: EASE }}
      className={cn(
        'rounded-xl border border-line bg-surface-1 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lift',
        hot && 'border-l-2 border-l-gold',
      )}
    >
      {/* 头行：日期时间 + 区域 + 星级 + 倒计时/预警 */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="tnum font-mono text-[13px] font-medium text-gold">
          {ev.dayLabel} {ev.time}
        </span>
        <RegionTag region={ev.region} />
        <Stars n={ev.stars} />
        <span className="ml-auto flex items-center gap-2">
          {hot && <AlertPill />}
          <span className="tnum rounded-full bg-surface-3 px-2 py-0.5 font-mono text-[10px] text-text-2">
            {tMinus(ev, new Date())}
          </span>
        </span>
      </div>
      <h3 className="mt-2.5 text-base font-medium text-text-1">{ev.name}</h3>
      <p className="tnum mt-1 font-mono text-xs text-text-2">
        预期 {ev.forecast} · 前值 {ev.previous}
      </p>
    </motion.div>
  )
}

/** S5 · 财经日历（bg-1 + noise-grid，纵向时间线） */
export default function EconCalendar() {
  const [region, setRegion] = useState<RegionFilter>('全部')
  const events = CAL_EVENTS.filter((e) => region === '全部' || e.region === region)

  const lineRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: lineRef,
    offset: ['start 80%', 'end 65%'],
  })

  return (
    <section className="noise-bg border-y border-line bg-bg-1 py-24">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        {/* 分区头 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14"
        >
          <div>
            <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold">
              <span className="inline-block h-3 w-0.5 bg-gold" />
              ECONOMIC CALENDAR
            </p>
            <h2 className="mt-3 text-2xl font-bold leading-8 text-text-1 md:text-[28px] md:leading-9">
              未来 7 天 · 中美财经日历
            </h2>
          </div>
          <SegmentedTabs<RegionFilter>
            options={(['全部', '中国', '美国'] as RegionFilter[]).map((v) => ({ value: v, label: v }))}
            value={region}
            onChange={setRegion}
            layoutId="cal-region"
          />
        </motion.div>

        {/* 纵向时间线 */}
        <div ref={lineRef} className="relative max-w-[860px]">
          {/* 竖线（滚动 scrub 生长） */}
          <motion.span
            aria-hidden
            style={{ scaleY: scrollYProgress, transformOrigin: 'top' }}
            className="absolute bottom-2 left-[3px] top-2 w-0.5 bg-surface-3"
          />
          <div className="space-y-5">
            {events.map((ev, i) => (
              <div key={ev.id} className="relative pl-8">
                <motion.span
                  aria-hidden
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, margin: '0px 0px -15% 0px' }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: i * 0.1 }}
                  className="absolute left-0 top-7 h-2 w-2 rounded-full bg-gold"
                />
                <EventCard ev={ev} index={i} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
