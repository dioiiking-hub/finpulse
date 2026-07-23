import type { ReactNode } from 'react'

/**
 * EmptyState（design.md §6.4）：empty-radar.svg 120px + 文案 + 操作区（ghost 按钮由调用方传入）。
 */
export default function EmptyState({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <img src="./empty-radar.svg" alt="" width={120} height={90} className="opacity-80" />
      <p className="text-sm text-text-2">{title}</p>
      {hint && <p className="text-xs text-text-3">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
