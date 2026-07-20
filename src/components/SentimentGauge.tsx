import { motion } from 'framer-motion'

export function sentimentLabel(v: number): string {
  if (v >= 80) return '极度贪婪'
  if (v >= 60) return '贪婪偏中性'
  if (v >= 40) return '中性'
  if (v >= 20) return '恐慌偏中性'
  return '极度恐慌'
}

/**
 * SentimentGauge（design.md §6.4）：半圆仪表 0–100，左恐慌右贪婪，
 * 金色指针 spring 到位，中央 mono 大数字 + 档位文字。
 */
export default function SentimentGauge({
  value,
  size = 200,
  animate = true,
}: {
  value: number
  size?: number
  animate?: boolean
}) {
  const v = Math.max(0, Math.min(100, value))
  const w = size
  const h = size * 0.62
  const cx = w / 2
  const cy = h - 8
  const r = w / 2 - 14
  // 角度：0 值 → 180°（左），100 → 0°（右）
  const arc = (from: number, to: number, rr: number) => {
    const a1 = Math.PI - (from / 100) * Math.PI
    const a2 = Math.PI - (to / 100) * Math.PI
    const x1 = cx + Math.cos(a1) * rr
    const y1 = cy - Math.sin(a1) * rr
    const x2 = cx + Math.cos(a2) * rr
    const y2 = cy - Math.sin(a2) * rr
    return `M${x1.toFixed(1)},${y1.toFixed(1)} A${rr},${rr} 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)}`
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* 底弧分段：恐慌(down绿)→中性(gold/40)→贪婪(up红)，按中国配色红=热 */}
        <path d={arc(0, 33, r)} fill="none" stroke="#35B37E" strokeOpacity="0.35" strokeWidth="8" strokeLinecap="round" />
        <path d={arc(34, 66, r)} fill="none" stroke="#D8A94E" strokeOpacity="0.35" strokeWidth="8" strokeLinecap="round" />
        <path d={arc(67, 100, r)} fill="none" stroke="#E5484D" strokeOpacity="0.35" strokeWidth="8" strokeLinecap="round" />
        {/* 已填进度弧 */}
        <motion.path
          d={arc(0, 100, r)}
          fill="none"
          stroke="#D8A94E"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={Math.PI * r}
          initial={animate ? { strokeDashoffset: Math.PI * r } : false}
          animate={{ strokeDashoffset: Math.PI * r * (1 - v / 100) }}
          transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1] }}
        />
        {/* 指针 */}
        <motion.g
          initial={animate ? { rotate: -90 } : false}
          animate={{ rotate: (v / 100) * 180 - 90 }}
          style={{ originX: `${cx}px`, originY: `${cy}px` }}
          transition={{ type: 'spring', stiffness: 60, damping: 12, duration: 1.2 }}
        >
          <line x1={cx} y1={cy} x2={cx} y2={cy - (r - 16)} stroke="#D8A94E" strokeWidth="2.5" strokeLinecap="round" />
        </motion.g>
        <circle cx={cx} cy={cy} r="5" fill="#D8A94E" />
        <circle cx={cx} cy={cy} r="9" fill="none" stroke="#D8A94E" strokeOpacity="0.4" />
        {/* 端点标签 */}
        <text x={cx - r} y={h - 2} fontSize="10" fill="#5F7183" textAnchor="middle">恐慌</text>
        <text x={cx + r} y={h - 2} fontSize="10" fill="#5F7183" textAnchor="middle">贪婪</text>
      </svg>
      <div className="-mt-10 flex flex-col items-center">
        <motion.span
          className="tnum font-mono text-3xl font-bold text-text-1"
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {v}
        </motion.span>
        <span className="mt-0.5 text-xs text-gold">{sentimentLabel(v)}</span>
      </div>
    </div>
  )
}
