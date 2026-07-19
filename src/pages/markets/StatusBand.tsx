import { motion } from 'framer-motion'
import { getMarketStatuses } from '@/data/markets'
import type { MarketSession } from '@/data/markets'
import { useNow } from '@/lib/useNow'
import { cn } from '@/lib/utils'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

/** 指定时区的 HH:mm（24h） */
function clockIn(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** 指定时区的 (分钟, 星期) */
function partsIn(date: Date, tz: string): { minutes: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const h = Number(get('hour')) % 24
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return { minutes: h * 60 + Number(get('minute')), day: dayMap[get('weekday')] ?? 0 }
}

/** 简化开闭市推算：工作日 + 时段（分钟数区间，本地时间） */
function sessionOf(date: Date, tz: string, ranges: [number, number][]): MarketSession {
  const { minutes, day } = partsIn(date, tz)
  if (day === 0 || day === 6) return 'closed'
  return ranges.some(([a, b]) => minutes >= a && minutes < b) ? 'open' : 'closed'
}

type Tone = 'live' | 'allday' | 'idle' | 'closed'

interface Chip {
  name: string
  label: string
  time?: string
  tone: Tone
}

const DOT: Record<Tone, string> = {
  live: 'bg-gold animate-pulse-dot',
  allday: 'bg-gold',
  idle: 'bg-text-3',
  closed: 'bg-surface-3',
}

const LABEL_COLOR: Record<Tone, string> = {
  live: 'text-gold',
  allday: 'text-gold',
  idle: 'text-text-2',
  closed: 'text-text-3',
}

/** S1 · 全球开收盘状态带（8 个市场 chip，横向可滚） */
export default function StatusBand() {
  const now = useNow(15_000)
  const d = new Date(now)
  const [aShare, hk, us] = getMarketStatuses(d)

  const toneOf = (s: MarketSession): Tone =>
    s === 'open' ? 'live' : s === 'closed' ? 'closed' : 'idle'

  // 日股 TSE 9:00–11:30 / 12:30–15:00（东京）；英股 LSE 8:00–16:30（伦敦）
  const jp = sessionOf(d, 'Asia/Tokyo', [[540, 690], [750, 900]])
  const uk = sessionOf(d, 'Europe/London', [[480, 990]])

  const chips: Chip[] = [
    { name: '沪深', label: aShare.label, time: clockIn(d, 'Asia/Shanghai'), tone: toneOf(aShare.session) },
    { name: '港股', label: hk.label, time: clockIn(d, 'Asia/Shanghai'), tone: toneOf(hk.session) },
    { name: '美股', label: us.label, time: clockIn(d, 'America/New_York'), tone: toneOf(us.session) },
    { name: '日股', label: jp === 'open' ? '交易中' : '已收盘', time: clockIn(d, 'Asia/Tokyo'), tone: toneOf(jp) },
    { name: '英股', label: uk === 'open' ? '交易中' : '已收盘', time: clockIn(d, 'Europe/London'), tone: toneOf(uk) },
    { name: '黄金', label: '24H', tone: 'allday' },
    { name: '原油', label: '24H', tone: 'allday' },
    { name: '加密', label: '24H', tone: 'allday' },
  ]

  return (
    <motion.div
      className="mt-6 flex gap-3 overflow-x-auto pb-1 scroll-thin"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
    >
      {chips.map((c) => (
        <motion.div
          key={c.name}
          variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } } }}
          className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-line bg-surface-1 px-3.5 font-mono text-xs"
        >
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT[c.tone])} />
          <span className="text-text-1">{c.name}</span>
          <span className={LABEL_COLOR[c.tone]}>{c.label}</span>
          {c.time && <span className="tnum text-text-3">{c.time}</span>}
        </motion.div>
      ))}
    </motion.div>
  )
}
