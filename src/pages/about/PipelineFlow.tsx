import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { FileJson, Globe, Monitor, Rss, ScanSearch } from 'lucide-react'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

interface PipelineNode {
  no: string
  icon: LucideIcon
  title: string
  desc: string
}

/** 数据链路五节点（about.md S2，fix-v2 补充 RSSHub 与插件快照环节；关键词数与 src/lib/recommend.ts 实际词库一致） */
const NODES: PipelineNode[] = [
  { no: '01', icon: Rss, title: '全球信源 20+', desc: 'RSSHub 财经路由 + 中美主流 RSS' },
  { no: '02', icon: Globe, title: '多链路拉取', desc: 'RSSHub 双实例互备 → 公共 CORS 代理，8s 超时' },
  { no: '03', icon: FileJson, title: '解析归一化', desc: '统一标题 / 时间 / 来源结构' },
  { no: '04', icon: ScanSearch, title: '关键词引擎', desc: '130+ 关键词分类与加权' },
  { no: '05', icon: Monitor, title: '前端看板', desc: '热点流 · 热度榜 · 行情快照叠加' },
]

/** 连接线上循环流动的 3px gold 光点（3s linear 无限，各线相位差 0.6s）——表达“数据在流动” */
function FlowDot({ delay, vertical = false }: { delay: number; vertical?: boolean }) {
  return (
    <motion.span
      aria-hidden
      className="absolute z-10 h-[3px] w-[3px] rounded-full bg-gold shadow-[0_0_6px_rgba(216,169,78,0.9)]"
      style={vertical ? { left: -1, top: 0 } : { top: -1, left: 0 }}
      animate={
        vertical
          ? { top: ['0%', '100%'], opacity: [0, 1, 1, 0] }
          : { left: ['0%', '100%'], opacity: [0, 1, 1, 0] }
      }
      transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay, times: [0, 0.12, 0.88, 1] }}
    />
  )
}

/** 节点间连接线：dashoffset 式绘制（scale 展开）1.2s + 流动光点；lg 横向 / mobile 纵向 */
function Connector({ index }: { index: number }) {
  return (
    <>
      {/* lg：横向连接线 */}
      <div className="relative hidden min-w-8 flex-1 items-center lg:flex" aria-hidden>
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ delay: 0.4 + index * 0.15, duration: 1.2, ease: EASE }}
          className="block h-px w-full origin-left bg-line"
        />
        <FlowDot delay={index * 0.6} />
      </div>
      {/* mobile：纵向连接线 */}
      <div className="relative flex h-10 w-px justify-center self-center lg:hidden" aria-hidden>
        <motion.span
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + index * 0.15, duration: 0.8, ease: EASE }}
          className="block h-full w-px origin-top bg-line"
        />
        <FlowDot delay={index * 0.6} vertical />
      </div>
    </>
  )
}

function NodeCard({ node, index }: { node: PipelineNode; index: number }) {
  const Icon = node.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: EASE }}
      className="w-full rounded-xl border border-line bg-surface-1 p-4 transition-colors duration-150 hover:border-gold/40 lg:w-[184px] lg:shrink-0"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-gold">
          <Icon size={17} strokeWidth={1.8} />
        </span>
        <span className="font-mono text-[11px] tracking-[0.08em] text-text-3">{node.no}</span>
      </div>
      <h3 className="mt-3 text-sm font-medium text-text-1">{node.title}</h3>
      <p className="mt-1 text-[11px] leading-5 text-text-3">{node.desc}</p>
    </motion.div>
  )
}

/** S2 · 数据链路图：横向管道（lg）/ 纵向（mobile）+ 降级说明条 */
export default function PipelineFlow() {
  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center">
        {NODES.map((n, i) => (
          <div key={n.no} className="flex flex-col lg:flex-1 lg:flex-row lg:items-center">
            <NodeCard node={n} index={i} />
            {i < NODES.length - 1 && <Connector index={i} />}
          </div>
        ))}
      </div>

      {/* 降级说明条 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
        className="mt-6 rounded-r-lg border-l-2 border-us-blue/60 bg-us-blue/5 px-4 py-3"
      >
        <p className="text-[13px] leading-6 text-text-2">
          任一环节失败或超时 → 自动切换内置演示数据流（30+ 条中美热点样本持续模拟生成），右上角徽标变为{' '}
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-us-blue">DEMO</span>
          ，恢复后自动切回。行情快照由插件定时任务每 30 分钟生成（iFinD / Yahoo Finance），前端按 id
          叠加真实盘面；快照缺失或超时（5s）时无缝回退演示行情。
        </p>
      </motion.div>
    </div>
  )
}
