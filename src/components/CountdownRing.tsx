import { cn } from '@/lib/utils'

/**
 * CountdownRing（design.md §6.4）：18px SVG 圆环，surface-3 底环 + gold 进度环。
 * progress = 剩余比例 0–1（1 = 刚开始倒计时）。
 */
export default function CountdownRing({
  progress,
  size = 18,
  stroke = 2,
  className,
  onClick,
  secondsLeft,
}: {
  progress: number
  size?: number
  stroke?: number
  className?: string
  onClick?: () => void
  secondsLeft?: number
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, progress))
  return (
    <button
      type="button"
      onClick={onClick}
      title="点击立即刷新"
      className={cn('group relative inline-flex items-center justify-center rounded-full', className)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1B2531" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#D8A94E"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear group-hover:stroke-gold-hover"
        />
      </svg>
      {typeof secondsLeft === 'number' && (
        <span className="sr-only">{secondsLeft} 秒后刷新</span>
      )}
    </button>
  )
}
