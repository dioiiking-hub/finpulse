import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Toast（design.md §6.4）：底部居中，surface-2 + gold 左点，2.4s 自动消失。
 * 用法：`toast('已复制标题')` + 在 Layout 挂一次 `<ToastHost />`。
 */

interface ToastItem {
  id: number
  message: string
}

let seq = 0
const listeners = new Set<(t: ToastItem) => void>()

export function toast(message: string) {
  const item = { id: ++seq, message }
  listeners.forEach((l) => l(item))
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const push = (t: ToastItem) => {
      setItems((prev) => [...prev.slice(-2), t])
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== t.id)), 2400)
    }
    listeners.add(push)
    return () => {
      listeners.delete(push)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-[90] -translate-x-1/2">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
            className="mt-2 flex items-center gap-2.5 rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm text-text-1 shadow-lift"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
