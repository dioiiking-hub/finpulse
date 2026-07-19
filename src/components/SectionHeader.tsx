import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/** 分区头：小标签（金色竖线 + mono 大写）+ H2 + 副文 */
export default function SectionHeader({
  tag,
  title,
  desc,
  align = 'left',
  className,
}: {
  tag: string
  title: ReactNode
  desc?: string
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      className={cn('mb-10 md:mb-14', align === 'center' && 'text-center', className)}
    >
      <p className={cn('flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold', align === 'center' && 'justify-center')}>
        <span className="inline-block h-3 w-0.5 bg-gold" />
        {tag}
      </p>
      <h2 className="mt-3 text-2xl font-bold leading-8 text-text-1 md:text-[28px] md:leading-9">{title}</h2>
      {desc && <p className="mt-2.5 text-sm text-text-2">{desc}</p>}
    </motion.div>
  )
}
