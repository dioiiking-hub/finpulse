import { motion } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

/** FAQ（about.md S6，答案与 src/lib/feeds.ts、src/lib/recommend.ts 实现一致） */
const FAQS = [
  {
    q: '数据延迟有多少？',
    a: 'RSS 源本身延迟 1–5 分钟，叠加 60s 轮询，端到端延迟通常 2–6 分钟，满足选题决策场景；行情类数据请以交易终端为准。',
  },
  {
    q: '为什么右上角显示「演示数据」？',
    a: '公共代理拉取失败或超时（>8s）时自动降级为内置演示数据流（30+ 条贴近当前时点的中美热点样本），保证看板始终可用；恢复后自动切回实时。',
  },
  {
    q: '热度分是怎么算的？',
    a: 'Score = 关键词权重 × 来源权重 × 时间衰减 × 跨源共振，归一化到 0–100；≥80 标记为「爆发」并触发选题预警。',
  },
  {
    q: '可以接入我们自己的后端或付费数据源吗？',
    a: '可以。数据层是适配器模式：实现同一接口即可替换为后端聚合 API / WebSocket 推送，前端组件零改动。',
  },
  {
    q: '选题模板能自定义吗？',
    a: '模板库（12 套）与关键词库均为配置文件，团队可按账号调性增删，推荐结果实时生效。',
  },
]

const TECH_ROWS = [
  { k: 'STACK', v: '前端演示版 · React 19 + Tailwind' },
  { k: 'DATA', v: '数据适配层可插拔' },
  { k: 'ROADMAP', v: '后端聚合 / WebSocket 实时推送' },
]

/** S6 · FAQ 手风琴 + 免责声明 / 技术说明卡 */
export default function FaqDisclaimer() {
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
      {/* 左列：FAQ */}
      <div className="lg:col-span-7">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-6"
        >
          <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold">
            <span className="inline-block h-3 w-0.5 bg-gold" />
            FAQ
          </p>
          <h2 className="mt-3 text-2xl font-bold leading-8 text-text-1 md:text-[28px] md:leading-9">常见问题</h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
        >
          <Accordion type="single" collapsible className="w-full border-t border-line">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`q-${i}`} className="border-b border-line">
                <AccordionTrigger className="py-4 text-[15px] font-medium text-text-1 hover:text-gold hover:no-underline [&[data-state=open]>svg]:text-gold">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 pr-6 text-[13px] leading-6 text-text-2">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>

      {/* 右列：免责声明 + 技术说明 */}
      <div className="lg:col-span-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-6"
        >
          <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold">
            <span className="inline-block h-3 w-0.5 bg-gold" />
            DISCLAIMER
          </p>
          <h2 className="mt-3 text-2xl font-bold leading-8 text-text-1 md:text-[28px] md:leading-9">合规与声明</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
          className="rounded-xl border border-line border-l-2 border-l-text-3 bg-surface-1 p-6"
        >
          <h3 className="flex items-center gap-2 text-[17px] font-medium text-text-1">
            <ShieldAlert size={16} className="text-text-3" />
            免责声明
          </h3>
          <p className="mt-3 text-[13px] leading-6 text-text-2">
            本站行情与资讯仅供团队内部选题参考，不构成任何投资建议。RSS 内容版权归原出版方所有。演示数据为模拟样本，与真实市场无关。
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
          className="mt-4 rounded-xl border border-line bg-surface-1 p-6"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-3">TECH NOTES</p>
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            {TECH_ROWS.map((r) => (
              <p key={r.k} className="flex items-baseline justify-between gap-4 font-mono text-xs leading-5">
                <span className="shrink-0 text-text-3">{r.k}</span>
                <span className="text-right text-text-2">{r.v}</span>
              </p>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
