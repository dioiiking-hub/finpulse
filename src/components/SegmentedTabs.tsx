import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * SegmentedTabs（design.md §6.4）：surface-1 容器 rounded-full p-1，
 * 选中项 surface-3 药丸 spring 滑动（layoutId 需调用方保证同组唯一）。
 */
export default function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  className,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  layoutId: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 overflow-x-auto rounded-full bg-surface-1 p-1 scroll-thin',
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs transition-colors duration-150',
              active ? 'text-text-1' : 'text-text-3 hover:text-text-2',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-surface-3"
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
