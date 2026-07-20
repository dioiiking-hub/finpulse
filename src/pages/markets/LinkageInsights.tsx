import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import CategoryTag from '@/components/CategoryTag'
import { INSIGHTS } from './data'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

/** S6 · 中美联动观察（盘面信号 → 选题机会） */
export default function LinkageInsights() {
  return (
    <section className="bg-bg-0 py-20">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-10 md:mb-14"
        >
          <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold">
            <span className="inline-block h-3 w-0.5 bg-gold" />
            CHINA × U.S. LINKAGE
          </p>
          <h2 className="mt-3 text-2xl font-bold leading-8 text-text-1 md:text-[28px] md:leading-9">中美联动观察</h2>
          <p className="mt-2.5 text-sm text-text-2">盘面信号 → 选题机会，自动生成的三条盘面解读。</p>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3">
          {INSIGHTS.map((ins, i) => (
            <motion.div
              key={ins.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -15% 0px' }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: EASE }}
              className="group relative flex flex-col rounded-xl border border-line bg-surface-1 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lift"
            >
              {/* 左 2px gold 竖线（生长 400ms） */}
              <motion.span
                aria-hidden
                initial={{ height: 0 }}
                whileInView={{ height: 'calc(100% - 3rem)' }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.15 + i * 0.12 }}
                className="absolute left-0 top-6 w-0.5 rounded-full bg-gold"
              />
              <CategoryTag category={ins.tag} className="w-fit" />
              <p className="mt-3.5 flex-1 text-sm leading-6 text-text-1">{ins.text}</p>
              <Link
                to={`/topics?category=${encodeURIComponent(ins.tag)}`}
                className="mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gold transition-colors hover:text-gold-hover"
              >
                生成选题
                <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
