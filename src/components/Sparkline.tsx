import { useId } from 'react'
import { motion } from 'framer-motion'

/**
 * Sparkline（design.md §6.4）：SVG 折线，红涨绿跌 1.5px 描边 + 下方 10% 渐变填充。
 */
export default function Sparkline({
  data,
  width = 96,
  height = 28,
  className,
  animate = true,
}: {
  data: number[]
  width?: number
  height?: number
  className?: string
  animate?: boolean
}) {
  const gid = useId()
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2)
    const y = pad + (1 - (v - min) / range) * (height - pad * 2)
    return [x, y] as const
  })
  const up = data[data.length - 1] >= data[0]
  const color = up ? '#E5484D' : '#35B37E'
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`
  const len = 400
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.18" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { strokeDasharray: len, strokeDashoffset: len } : false}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  )
}
