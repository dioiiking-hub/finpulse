import { useId } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { heatColor } from '@/components/HeatBadge'
import { heatTier } from '@/lib/recommend'
import { useNow } from '@/lib/useNow'
import type { Grade, ScoreDims } from './model'
import { DIM_TIPS } from './model'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

/** 推荐等级徽标：S = gold 底 + 脉冲点；A = gold 描边；B = line 描边（topics.md S3） */
export function GradeBadge({ grade, className }: { grade: Grade; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 font-mono text-xs font-bold leading-none',
        grade === 'S' && 'bg-gold text-on-gold',
        grade === 'A' && 'border border-gold/60 text-gold',
        grade === 'B' && 'border border-line text-text-2',
        className,
      )}
    >
      {grade === 'S' && <span className="h-1.5 w-1.5 rounded-full bg-on-gold animate-pulse-dot" />}
      {grade}
    </span>
  )
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** 爆发级热点的「黄金 2 小时」时效 chip（秒级倒计时，到期隐藏） */
export function GoldenChip({ until }: { until: number }) {
  const now = useNow(1000)
  const remain = until - now
  if (remain <= 0) return null
  const totalSec = Math.floor(remain / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-up/60 px-2.5 text-xs leading-none text-up">
      <Flame size={12} strokeWidth={1.8} />
      黄金 2 小时
      <span className="tnum font-mono">
        剩 {h}:{pad2(m)}:{pad2(s)}
      </span>
    </span>
  )
}

/* -------- 推荐理由高亮渲染（**短语** 与数字自动 gold） -------- */

const NUM_RE =
  /([+-]?\d[\d.,]*(?:[–-]\d[\d.,]*)?(?:\s?(?:%|％|BP|万亿|亿|万|信源|分钟|小时|天|秒|倍|家|美元|元|条))?)/g

function renderSegment(seg: string, keyPrefix: string): ReactNode[] {
  return seg
    .split(NUM_RE)
    .map((part, j) =>
      part ? (
        j % 2 === 1 ? (
          <em key={`${keyPrefix}-${j}`} className="tnum not-italic text-gold">
            {part}
          </em>
        ) : (
          <span key={`${keyPrefix}-${j}`}>{part}</span>
        )
      ) : null,
    )
}

/** 推荐理由正文：**短语** 与关键数字 gold 高亮（<em> 样式） */
export function ReasonText({ text, className }: { text: string; className?: string }) {
  const parts: ReactNode[] = []
  text.split('**').forEach((seg, i) => {
    if (!seg) return
    if (i % 2 === 1) {
      parts.push(
        <em key={`em-${i}`} className="not-italic text-gold">
          {seg}
        </em>,
      )
    } else {
      parts.push(...renderSegment(seg, `s${i}`))
    }
  })
  return <p className={className}>{parts}</p>
}

/* -------- 四维评分 -------- */

/** 卡片用迷你评分条（32px 条 + mono 值，hover title 出口径说明） */
export function ScoreDimsMini({ dims }: { dims: ScoreDims }) {
  return (
    <div className="flex items-start gap-3">
      {DIM_TIPS.map((d, i) => {
        const v = dims[d.key]
        return (
          <div key={d.key} className="flex flex-col gap-1" title={d.tip}>
            <span className="text-[10px] leading-none text-text-3">{d.key}</span>
            <div className="h-1 w-8 overflow-hidden rounded-full bg-surface-3">
              <motion.div
                className="h-full rounded-full"
                style={{ background: heatColor(v) }}
                initial={{ width: 0 }}
                whileInView={{ width: `${v}%` }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: EASE }}
              />
            </div>
            <span className="tnum font-mono text-[10px] leading-none text-text-2">{v}</span>
          </div>
        )
      })}
    </div>
  )
}

/** 抽屉用完整评分条（标签 + 160px 渐变条 + mono 值 + 口径说明） */
export function ScoreDimsFull({ dims }: { dims: ScoreDims }) {
  return (
    <div className="flex flex-col gap-3.5">
      {DIM_TIPS.map((d, i) => {
        const v = dims[d.key]
        return (
          <div key={d.key}>
            <div className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-[13px] text-text-2">{d.key}</span>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-surface-3">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, #3D6DB5, ${heatColor(v)})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${v}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: EASE }}
                />
              </div>
              <span className="tnum font-mono text-[13px] font-medium" style={{ color: heatColor(v) }}>
                {v}
              </span>
            </div>
            <p className="mt-1 pl-[60px] text-[11px] leading-4 text-text-3">
              {d.key}：{d.tip}
            </p>
          </div>
        )
      })}
    </div>
  )
}

/* -------- 热度环（抽屉） -------- */

const TIER_TEXT: Record<string, string> = {
  平静: 'text-text-3',
  温热: 'text-gold',
  热门: 'text-gold',
  爆发: 'text-up',
}

export function HeatRing({ heat, size = 96 }: { heat: number; size?: number }) {
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const tier = heatTier(heat)
  const gradId = useId()
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D8A94E" />
            <stop offset="100%" stopColor="#E5484D" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1B2531" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(100, heat)) / 100) }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum font-mono text-[28px] font-bold leading-none" style={{ color: heatColor(heat) }}>
          {heat}
        </span>
        <span className={cn('mt-1.5 text-[11px] leading-none', TIER_TEXT[tier])}>{tier}</span>
      </div>
    </div>
  )
}
