import { motion } from 'framer-motion'
import type { Category } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/types'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

/** 公式 token：K/S/T/C 依次 gold 扫过高亮（300ms，间隔 0.4s，滚动到位触发一轮） */
const FORMULA_TOKENS = ['Score', '=', 'K', '×', 'S', '×', 'T', '×', 'C'] as const
const FACTOR_LETTERS = ['K', 'S', 'T', 'C'] as const

/**
 * 四因子（与 src/lib/recommend.ts 实际实现一致）：
 * computeHeat = (0.42 + 0.43·kwBase + hotBonus) · 来源权重 · (0.35 + 0.65·时间衰减)，
 * 再由 applyCrossSourceBoost 做跨源共振加成。
 */
const FACTOR_CARDS = [
  {
    key: 'K',
    name: '关键词权重',
    desc: '核心词命中越多权重越高（3 个封顶）；「降息 / 新高 / 超预期」等爆发词额外 +0.15 加成；130+ 关键词按 7 大分类维护',
  },
  {
    key: 'S',
    name: '来源权重',
    desc: '一线快讯信源权重更高（0.72–1.0，见闻 / Reuters / Bloomberg 为满权）；多信源交叉验证加分',
  },
  {
    key: 'T',
    name: '时间衰减',
    desc: '半衰期 90 分钟的指数衰减；越新鲜分越高，隔夜热点自动降权',
  },
  {
    key: 'C',
    name: '跨源共振',
    desc: '多家信源同题报道 → 每多一源 +2 分共振加成（上限 +8）；3 源以上共振往往意味着大事件',
  },
]

/** 分类词库 chips 墙（取自 recommend.ts CATEGORY_KEYWORDS 代表词） */
const KEYWORD_GROUPS: { category: Category; words: string[] }[] = [
  { category: '宏观政策', words: ['美联储', 'CPI', '降息', '非农', '央行', 'LPR'] },
  { category: '美股', words: ['纳斯达克', '标普', '道琼斯', '特斯拉'] },
  { category: 'A股港股', words: ['沪指', '北向', '两融', '恒生'] },
  { category: '大宗商品', words: ['黄金', '原油', '铜', 'OPEC'] },
  { category: '科技AI', words: ['英伟达', '大模型', '芯片', '算力'] },
  { category: '监管地缘', words: ['证监会', '关税', '制裁', '出口管制'] },
  { category: '加密货币', words: ['比特币', '以太坊', 'ETF', '稳定币'] },
]

/** 热度档位刻度（heatTier：40 温热 / 60 热门 / 80 爆发） */
const HEAT_TICKS = [
  { v: 40, label: '温热', cls: 'text-gold' },
  { v: 60, label: '热门', cls: 'font-bold text-gold' },
  { v: 80, label: '爆发', cls: 'text-up' },
]

function FormulaToken({ token }: { token: string }) {
  const factorIdx = (FACTOR_LETTERS as readonly string[]).indexOf(token)
  if (factorIdx === -1) {
    return <span className="text-text-2">{token}</span>
  }
  return (
    <motion.span
      initial={{ color: '#E9EEF4' }}
      whileInView={{ color: ['#E9EEF4', '#D8A94E', '#D8A94E', '#E9EEF4'] }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ delay: 0.4 + factorIdx * 0.4, duration: 0.9, times: [0, 0.3, 0.7, 1], ease: 'easeInOut' }}
      className="font-bold"
    >
      {token}
    </motion.span>
  )
}

/** S4 · 推荐引擎白皮书：公式主卡 + 四因子卡 + 分类词库 + 热度档位条 */
export default function EngineWhitepaper() {
  return (
    <div>
      {/* 公式主卡 */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="rounded-xl border border-line bg-surface-1 p-8 text-center"
      >
        <p className="font-mono text-[17px] tracking-wide md:text-xl">
          {FORMULA_TOKENS.map((t, i) => (
            <span key={i} className="mx-1 inline-block md:mx-1.5">
              <FormulaToken token={t} />
            </span>
          ))}
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-text-3">
          归一化 0–100 · 每 60s 随轮询重算 · 热度 ≥80 触发「爆发」预警
        </p>
      </motion.div>

      {/* 四因子卡 */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FACTOR_CARDS.map((f, i) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, rotateX: 8, y: 24 }}
            whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: EASE }}
            style={{ transformPerspective: 800 }}
            className="rounded-xl border border-line bg-surface-1 p-5 transition-colors duration-150 hover:border-gold/40"
          >
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold leading-none text-gold">{f.key}</span>
              <span className="text-[13px] font-medium text-text-1">{f.name}</span>
            </div>
            <p className="mt-2.5 text-xs leading-5 text-text-2">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* 分类词库 chips 墙 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mt-10 rounded-xl border border-line bg-surface-1 p-6"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-[15px] font-medium text-text-1">分类关键词库</h3>
          <span className="font-mono text-[11px] text-text-3">7 大分类 · 130+ 关键词</span>
        </div>
        <div className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
          {KEYWORD_GROUPS.map((g, gi) => (
            <div key={g.category}>
              <p className="flex items-center gap-1.5 text-xs text-text-2">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[g.category] }}
                />
                {g.category}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {g.words.map((w, wi) => (
                  <motion.span
                    key={w}
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: gi * 0.06 + wi * 0.02, duration: 0.3, ease: EASE }}
                    className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-text-2"
                  >
                    {w}
                  </motion.span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 热度档位条 */}
      <div className="relative mt-12 pb-7">
        <div className="h-2 overflow-hidden rounded-full bg-surface-3">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #3D6DB5 0%, #D8A94E 60%, #E5484D 100%)' }}
            initial={{ width: '0%' }}
            whileInView={{ width: '100%' }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 1.2, ease: EASE }}
          />
        </div>
        <span className="absolute left-0 top-4 font-mono text-[10px] text-text-3">0</span>
        <span className="absolute right-0 top-4 font-mono text-[10px] text-text-3">100</span>
        {HEAT_TICKS.map((t) => (
          <div key={t.v} className="absolute top-0 -translate-x-1/2" style={{ left: `${t.v}%` }}>
            <span className="mx-auto block h-3 w-px bg-text-3/60" />
            <span className="mt-1 block whitespace-nowrap text-center font-mono text-[10px] text-text-3">
              {t.v} <span className={t.cls}>{t.label}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
