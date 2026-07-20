import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'

/** 数字 count-up（800ms easeOut，小数位同步滚动） */
export default function CountUp({
  value,
  duration = 0.8,
  decimals = 0,
  className,
}: {
  value: number
  duration?: number
  decimals?: number
  className?: string
}) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) =>
    v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
  )
  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [value, duration, mv])
  return <motion.span className={className}>{text}</motion.span>
}
