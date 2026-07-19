import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { heatTier } from '@/lib/recommend'

/** 热度渐变插值：heat-cool → gold → heat-hot（0 → 60 → 100） */
function hexLerp(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  const mix = pa.map((v, i) => Math.round(v + (pb[i] - v) * t))
  return `#${mix.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function heatColor(heat: number): string {
  const h = Math.max(0, Math.min(100, heat))
  return h <= 60
    ? hexLerp('#3D6DB5', '#D8A94E', h / 60)
    : hexLerp('#D8A94E', '#E5484D', (h - 60) / 40)
}

const TIER_STYLE: Record<string, string> = {
  平静: 'text-text-3',
  温热: 'text-gold',
  热门: 'text-gold font-bold',
  爆发: 'text-up',
}

/**
 * HeatBadge（design.md §6.4）：mono 分数 + 渐变条 + 档位文字。
 */
export default function HeatBadge({
  heat,
  barWidth = 64,
  className,
  animate = true,
}: {
  heat: number
  barWidth?: number
  className?: string
  animate?: boolean
}) {
  const tier = heatTier(heat)
  const color = heatColor(heat)
  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <div className="flex items-center gap-1.5">
        <span className="tnum font-mono text-xl font-bold leading-none" style={{ color }}>
          {heat}
        </span>
        {tier === '爆发' && <span className="h-1.5 w-1.5 rounded-full bg-up animate-pulse-dot" />}
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-3" style={{ width: barWidth }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, #3D6DB5, ${color})` }}
          initial={animate ? { width: 0 } : false}
          animate={{ width: `${heat}%` }}
          transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
        />
      </div>
      <span className={cn('text-[11px] leading-none', TIER_STYLE[tier])}>{tier}</span>
    </div>
  )
}
