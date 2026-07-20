import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight, Flame, LayoutTemplate, Rss, Sparkles } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import { scrollToId } from '@/lib/scroll'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

const STEPS = [
  { no: '01', icon: Rss, title: '多源采集', desc: '12+ 中美财经信源，RSS 准实时拉取，60 秒轮询' },
  { no: '02', icon: Flame, title: '热度评分', desc: '关键词权重 × 来源权重 × 时间衰减 × 跨源共振' },
  { no: '03', icon: LayoutTemplate, title: '模板匹配', desc: '12 套爆款选题模板，按分类与平台自动匹配' },
  { no: '04', icon: Sparkles, title: '理由生成', desc: '为什么值得做、适合哪个平台，一条理由讲清楚' },
]

/** S5 · 选题引擎工作流 */
export function Workflow() {
  return (
    <section className="bg-bg-0 py-24">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <SectionHeader tag="HOW IT WORKS" title="从热点到选题，四步直达" />
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.no}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: EASE }}
              className="relative"
            >
              {/* 虚线连接（lg 横向） */}
              {i < STEPS.length - 1 && (
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.12, duration: 1.4, ease: EASE }}
                  className="absolute left-full top-8 hidden h-px w-6 origin-left border-t border-dashed border-line lg:block"
                  aria-hidden
                />
              )}
              <div className="flex items-center gap-3">
                <span className="font-display text-[32px] font-bold leading-none text-gold/40">{s.no}</span>
                <motion.span
                  initial={{ rotate: -180, opacity: 0 }}
                  whileInView={{ rotate: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.12, duration: 0.5, ease: EASE }}
                  className="text-gold"
                >
                  <s.icon size={20} strokeWidth={1.8} />
                </motion.span>
              </div>
              <h3 className="mt-4 text-[17px] font-medium text-text-1">{s.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-text-2">{s.desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
          className="mt-14"
        >
          <Link
            to="/topics"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gold px-5 text-sm font-medium text-on-gold transition-all duration-150 hover:-translate-y-px hover:bg-gold-hover active:scale-[0.97]"
          >
            查看推荐选题
            <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

/** S6 · CTA 收束带 */
export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-line bg-bg-1 py-28">
      {/* 极淡金色径向辉光 */}
      <motion.div
        initial={{ scale: 1, opacity: 0.06 }}
        whileInView={{ scale: 1.05, opacity: 0.08 }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 55%, #D8A94E 0%, transparent 70%)' }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1200px] px-4 text-center md:px-8">
        <h2 className="text-3xl font-black leading-[40px] text-text-1 md:text-[40px] md:leading-[48px]">
          {['让每一条热点，', '都成为下一个爆款选题'].map((line, i) => (
            <span key={line} className="block overflow-hidden">
              <motion.span
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ delay: i * 0.15, duration: 0.6, ease: EASE }}
                className={i === 1 ? 'gold-text-grad block' : 'block'}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <button
            type="button"
            onClick={() => scrollToId('feed')}
            className="h-10 rounded-lg bg-gold px-5 text-sm font-medium text-on-gold transition-all duration-150 hover:-translate-y-px hover:bg-gold-hover active:scale-[0.97]"
          >
            进入热点流
          </button>
          <Link
            to="/about"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line px-5 text-sm text-text-1 transition-colors duration-150 hover:border-gold/60 hover:text-gold"
          >
            了解数据源与协作
            <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
