import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import DataStatusBadge from '@/components/DataStatusBadge'
import SectionHeader from '@/components/SectionHeader'
import { useNewsFeed } from '@/lib/feeds'
import { useNow } from '@/lib/useNow'
import { beijingClock } from '@/lib/time'
import PipelineFlow from '@/pages/about/PipelineFlow'
import SourceTable from '@/pages/about/SourceTable'
import EngineWhitepaper from '@/pages/about/EngineWhitepaper'
import TeamWorkflow from '@/pages/about/TeamWorkflow'
import FaqDisclaimer from '@/pages/about/FaqDisclaimer'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

/** S1 · 页头：标签 x -16→0 / H1 字级 stagger / 副文 delay 0.3s / 状态卡 delay 0.45s */
function PageHeader() {
  const { status, lastUpdated } = useNewsFeed()
  useNow(1000) // 状态卡秒级刷新（与导航栏时钟同步）
  return (
    <section className="relative overflow-hidden bg-bg-0">
      {/* world-dots.svg 淡化背景：opacity 0.35，两侧淡出 mask */}
      <img
        src="/world-dots.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-[0.35]"
        style={{
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 45%, black 70%, transparent 100%)',
          maskImage: 'linear-gradient(to right, transparent 0%, black 45%, black 70%, transparent 100%)',
        }}
      />
      <div className="relative mx-auto max-w-[1200px] px-4 pb-10 pt-16 md:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[640px]">
            <motion.p
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold"
            >
              <span className="inline-block h-3 w-0.5 bg-gold" />
              DATA &amp; WORKFLOW
            </motion.p>
            <h1
              aria-label="数据源与团队协作"
              className="mt-3 text-[30px] font-black leading-[38px] text-text-1 md:text-[40px] md:leading-[48px]"
            >
              {'数据源与团队协作'.split('').map((ch, i) => (
                <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom">
                  <motion.span
                    initial={{ y: 36, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.08 + i * 0.045, duration: 0.5, ease: EASE }}
                    className="inline-block"
                  >
                    {ch}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
              className="mt-4 text-[15px] leading-7 text-text-2"
            >
              透明的数据链路、可解释的推荐逻辑、为编辑团队设计的协作流程。纯前端演示架构，数据适配层可插拔，随时平滑升级至后端聚合。
            </motion.p>
          </div>

          {/* DataStatus 大徽标卡 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5, ease: EASE }}
            className="w-full shrink-0 rounded-xl border border-line bg-surface-1/90 p-4 backdrop-blur-sm lg:w-[264px]"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-3">
                DATA STATUS
              </span>
              <DataStatusBadge status={status} />
            </div>
            <div className="mt-3 space-y-1.5 border-t border-line pt-3 font-mono text-xs text-text-2">
              <p className="flex items-center justify-between">
                <span className="text-text-3">POLL</span>
                <span className="tnum">60s 轮询</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-text-3">TIMEOUT</span>
                <span className="tnum">8s 超时降级</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-text-3">UPDATED</span>
                <span className="tnum">{beijingClock(new Date(lastUpdated))}</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/** S7 · 收束 CTA：行级 stagger + 极淡 gold 径向辉光随滚动缩放 */
function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-line bg-bg-0 py-24">
      <motion.div
        initial={{ scale: 1, opacity: 0.06 }}
        whileInView={{ scale: 1.05, opacity: 0.09 }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 55%, #D8A94E 0%, transparent 70%)' }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1200px] px-4 text-center md:px-8">
        <h2 className="text-2xl font-bold leading-8 text-text-1 md:text-[28px] md:leading-9">
          {['准备好让热点', '变成爆款了吗？'].map((line, i) => (
            <span key={line} className="block overflow-hidden">
              <motion.span
                initial={{ y: 32, opacity: 0 }}
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
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gold px-5 text-sm font-medium text-on-gold transition-all duration-150 hover:-translate-y-px hover:bg-gold-hover active:scale-[0.97]"
          >
            进入热点监控
            <ArrowRight size={15} />
          </Link>
          <Link
            to="/topics"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line px-5 text-sm text-text-1 transition-colors duration-150 hover:border-gold/60 hover:text-gold"
          >
            查看今日选题
            <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

/** 数据源与协作 `/about`：数据链路 + 信源清单 + 推荐引擎白皮书 + 团队工作流 + FAQ/声明 */
export default function About() {
  return (
    <div>
      <PageHeader />

      {/* S2 · 数据链路 */}
      <section className="border-t border-line bg-bg-0 py-16">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <SectionHeader
            tag="DATA PIPELINE"
            title="数据链路"
            desc="从全球信源到你的屏幕，五步透明可视。"
            className="mb-10"
          />
          <PipelineFlow />
        </div>
      </section>

      {/* S3 · 信源清单 */}
      <section className="noise-bg border-t border-line bg-bg-1 py-16">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <SectionHeader tag="SOURCES" title="信源清单" desc="重点覆盖中美，兼顾全球宏观。" className="mb-10" />
          <SourceTable />
        </div>
      </section>

      {/* S4 · 推荐引擎白皮书 */}
      <section className="border-t border-line bg-bg-0 py-16">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <SectionHeader
            tag="RECOMMEND ENGINE"
            title="推荐引擎如何工作"
            desc="规则驱动、完全可解释 —— 团队的每个人都看得懂分数从哪来。"
            className="mb-10"
          />
          <EngineWhitepaper />
        </div>
      </section>

      {/* S5 · 团队协作工作流 */}
      <section className="noise-bg border-t border-line bg-bg-1 py-16">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <SectionHeader
            tag="TEAM WORKFLOW"
            title="一个选题的团队旅程"
            desc="四个角色，一条流水线。"
            className="mb-10"
          />
          <TeamWorkflow />
        </div>
      </section>

      {/* S6 · FAQ + 免责声明 */}
      <section className="border-t border-line bg-bg-0 py-16">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <FaqDisclaimer />
        </div>
      </section>

      <FinalCta />
    </div>
  )
}
