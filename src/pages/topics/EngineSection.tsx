import { Fragment } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Flame, LayoutTemplate, Search, Sparkles } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

const NODES = [
  { icon: Search, title: '关键词命中', desc: '美联储 / CPI / 降息 / 非农 / 证监会 … 200+ 关键词库按分类加权' },
  { icon: Flame, title: '热度评分', desc: 'Score = 关键词权重 × 来源权重 × 时间衰减 × 跨源共振' },
  { icon: LayoutTemplate, title: '模板匹配', desc: '14 套爆款模板按分类与平台自动套用' },
  { icon: Sparkles, title: '理由生成', desc: '分类 × 热度 × 受众 × 差异化，生成人话理由' },
]

const TEMPLATES = [
  { label: '「XX 大跌，背后三个信号」', example: '黄金大跌，背后三个信号' },
  { label: '「一图看懂 XX 对 A 股的影响」', example: '一图看懂美联储降息对 A 股的影响' },
  { label: '「XX 创新高：还能上车吗」', example: '金价创新高：还能上车吗' },
  { label: '「复盘：上次发生 XX 之后」', example: '复盘：上次降息落地之后' },
  { label: '「XX 新规，谁受益谁受伤」', example: '程序化交易新规，谁受益谁受伤' },
  { label: '「三分钟读懂 XX」', example: '三分钟读懂 MLF 降息' },
  { label: '「XX 与 YY 的跷跷板」', example: '美元与黄金的跷跷板' },
  { label: '「数据告诉你 XX 的真相」', example: '数据告诉你万亿成交的真相' },
  { label: '「深聊丨XX 之后，钱会往哪去？」', example: '深聊丨出口管制升级之后，钱会往哪去？' },
  { label: '「从 XX 聊起：普通投资者能学到什么」', example: '从出口管制聊起：普通投资者能学到什么' },
]

const FACTORS = [
  { token: 'K', label: '关键词', note: '200+ 关键词按分类加权，命中越多权重越高' },
  { token: 'S', label: '来源', note: '权威信源加权，一线媒体与通讯社权重最高' },
  { token: 'T', label: '时间衰减', note: '半衰期 90 分钟，越新鲜分越高' },
  { token: 'C', label: '跨源共振', note: '多信源同题报道额外加成' },
]

/** 公式因子 token：滚动到位后依次金色扫过高亮一轮 */
const tokenV: Variants = {
  hidden: { backgroundColor: 'rgba(216,169,78,0)', color: '#E9EEF4' },
  show: (i: number) => ({
    backgroundColor: ['rgba(216,169,78,0)', 'rgba(216,169,78,0.28)', 'rgba(216,169,78,0.06)'],
    transition: { delay: 0.4 + i * 0.4, duration: 0.9, times: [0, 0.35, 1] },
  }),
}

/** S5 · 评分引擎说明（bg-1 + noise-grid）：四节点管道 + 公式卡 + 模板 chips 墙 */
export default function EngineSection() {
  return (
    <section className="noise-bg border-t border-line bg-bg-1 py-24">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <SectionHeader
          tag="UNDER THE HOOD"
          title="选题如何被推荐出来"
          desc="透明可解释的推荐逻辑，团队可对齐认知、校准模板。"
        />

        {/* 四节点管道 */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {NODES.map((n, i) => (
            <motion.div
              key={n.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: EASE }}
              className="relative"
            >
              {i < NODES.length - 1 && (
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
                <span className="tnum font-mono text-[32px] font-bold leading-none text-gold/40">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-gold">
                  <n.icon size={20} strokeWidth={1.8} />
                </span>
              </div>
              <h3 className="mt-4 text-[17px] font-medium text-text-1">{n.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-text-2">{n.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* 公式卡 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mx-auto mt-16 max-w-[720px] rounded-xl border border-line bg-surface-1 p-6 md:p-8"
        >
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-3 font-mono"
          >
            <span className="text-lg font-bold text-text-1">Score</span>
            <span className="text-text-3">=</span>
            {FACTORS.map((f, i) => (
              <Fragment key={f.token}>
                {i > 0 && <span className="text-text-3">×</span>}
                <motion.span
                  custom={i}
                  variants={tokenV}
                  className="rounded-md px-2.5 py-1.5 text-base font-bold"
                >
                  {f.token}
                  <span className="ml-1 text-xs font-normal text-text-2">({f.label})</span>
                </motion.span>
              </Fragment>
            ))}
          </motion.div>
          <div className="mt-6 grid grid-cols-1 gap-3 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {FACTORS.map((f) => (
              <p key={f.token} className="text-center text-[11px] leading-5 text-text-3">
                <span className="tnum font-mono font-bold text-gold">{f.token}</span> · {f.note}
              </p>
            ))}
          </div>
        </motion.div>

        {/* 模板 chips 墙 */}
        <div className="mt-14">
          <p className="mb-4 text-[11px] tracking-[0.08em] text-text-3">爆款模板库 · 14 套节选（hover 查看示例）</p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t, i) => (
              <motion.span
                key={t.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03, duration: 0.3, ease: EASE }}
                title={`示例：${t.example}`}
                className="cursor-default rounded-full border border-transparent bg-surface-2 px-3 py-1.5 text-xs text-text-2 transition-colors duration-150 hover:border-gold/40 hover:text-gold"
              >
                {t.label}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
