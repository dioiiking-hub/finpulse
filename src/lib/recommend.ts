import type { Category, NewsItem, Platform, Region, TopicRecommendation } from '@/lib/types'

/**
 * 规则推荐引擎（design.md §7 / home.md S5）：
 * 关键词分类 → 热度评分（关键词权重 × 来源权重 × 时间衰减 × 跨源共振）
 * → 选题标题模板 → 推荐理由 → 平台适配。
 * 首页与 topics 页共用。
 */

/* ---------------- 关键词分类 ---------------- */

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  宏观政策: ['美联储', '降息', '加息', '央行', 'cpi', '通胀', 'lpr', 'mlf', 'pmi', '非农', '就业', '利率', '国债', '收益率', '汇率', '人民币', '美元', '财政', '货币政策', '流动性', '欧央行', '日本央行', 'fed', 'fomc', 'inflation', 'rate'],
  美股: ['纳斯达克', '标普', '道琼斯', '美股', '七巨头', '特斯拉', '苹果', '微软', '谷歌', 'meta', '亚马逊', '伯克希尔', '巴菲特', '中概股', 'nasdaq', 's&p', 'dow', 'earnings'],
  A股港股: ['沪指', 'a股', '港股', '恒生', '南向', '北向', '科创', '创业板', '涨停', '成交', '两融', '白酒', '比亚迪', '宁德', '茅台', '创新药', '券商', '沪深'],
  大宗商品: ['黄金', '原油', '铜', '白银', 'opec', 'wti', '布伦特', '大宗', '有色', '铁矿', '天然气', '金价', '油价', 'gold', 'oil', 'copper'],
  科技AI: ['ai', '大模型', '英伟达', '芯片', '算力', '半导体', 'openai', 'gpt', '机器人', '自动驾驶', '云计算', '数据中心', '昇腾', '光模块', '存储', 'nvidia', 'tech'],
  监管地缘: ['证监会', '监管', '关税', '制裁', '出口管制', '实体清单', '地缘', '听证', '法案', '网信办', '欧盟', '反制', '301', 'tariff', 'sanction', 'sec'],
  加密货币: ['比特币', '以太坊', '加密', '稳定币', 'etf', 'circle', 'coinbase', '质押', '链上', 'crypto', 'bitcoin', 'eth'],
}

/** 来源权重（权威/速度加权） */
const SOURCE_WEIGHTS: Record<string, number> = {
  华尔街见闻: 1.0,
  财联社: 0.95,
  金十数据: 0.9,
  东方财富: 0.85,
  新浪财经: 0.8,
  澎湃新闻: 0.8,
  Reuters: 1.0,
  Bloomberg: 1.0,
  CNBC: 0.9,
  MarketWatch: 0.85,
  'Yahoo Finance': 0.8,
  FT: 0.95,
  BBC: 0.85,
  CoinDesk: 0.8,
}

const DEFAULT_SOURCE_WEIGHT = 0.72

/** 高热度关键词（命中额外加分） */
const HOT_KEYWORDS = ['降息', '新高', '超预期', '突破', '暴涨', '大跌', '创新高', '创新低', '紧急', '首次', '历史', 'record', 'surge', 'plunge']

/* ---------------- 分类与热度 ---------------- */

/** 基于关键词命中的规则分类（返回分类与命中词） */
export function classifyText(title: string, summary = ''): { category: Category; hits: string[] } {
  const text = `${title} ${summary}`.toLowerCase()
  let best: Category = '宏观政策'
  let bestScore = 0
  let bestHits: string[] = []
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    const hits = words.filter((w) => text.includes(w.toLowerCase()))
    const score = hits.reduce((acc, w) => acc + (title.toLowerCase().includes(w.toLowerCase()) ? 2 : 1), 0)
    if (score > bestScore) {
      bestScore = score
      best = cat
      bestHits = hits
    }
  }
  return { category: best, hits: bestHits }
}

/** 时间衰减：半衰期 90 分钟的指数衰减 */
export function timeDecay(publishedAt: number, now = Date.now()): number {
  const ageMin = Math.max(0, (now - publishedAt) / 60_000)
  return Math.pow(0.5, ageMin / 90)
}

/** 单条热度分（0–100）：关键词权重 × 来源权重 × 时间衰减 */
export function computeHeat(item: Pick<NewsItem, 'title' | 'summary' | 'source' | 'publishedAt'>, now = Date.now()): number {
  const text = `${item.title} ${item.summary}`.toLowerCase()
  const { hits } = classifyText(item.title, item.summary)
  const kwBase = Math.min(1, hits.length / 3)
  const hotBonus = HOT_KEYWORDS.some((w) => text.includes(w)) ? 0.15 : 0
  const srcW = SOURCE_WEIGHTS[item.source] ?? DEFAULT_SOURCE_WEIGHT
  const raw = (0.42 + 0.43 * kwBase + hotBonus) * srcW * (0.35 + 0.65 * timeDecay(item.publishedAt, now))
  return Math.round(Math.max(0, Math.min(100, raw * 100)))
}

/** 已加成过的条目 id（防止轮询时重复抬升） */
const boostedIds = new Set<string>()

/** 跨源共振：多个不同来源报道相近关键词时整体抬升（幂等，每条只加成一次） */
export function applyCrossSourceBoost<T extends NewsItem>(items: T[]): T[] {
  if (boostedIds.size > 5000) boostedIds.clear()
  const kwSources = new Map<string, Set<string>>()
  for (const it of items) {
    for (const kw of it.keywords ?? []) {
      const set = kwSources.get(kw) ?? new Set<string>()
      set.add(it.source)
      kwSources.set(kw, set)
    }
  }
  return items.map((it) => {
    const resonance = (it.keywords ?? []).reduce((acc, kw) => acc + ((kwSources.get(kw)?.size ?? 1) - 1), 0)
    const boost = Math.min(8, resonance * 2)
    if (boost <= 0 || boostedIds.has(it.id)) return it
    boostedIds.add(it.id)
    return { ...it, heat: Math.min(100, it.heat + boost) }
  })
}

/* ---------------- 档位 ---------------- */

export type HeatTier = '平静' | '温热' | '热门' | '爆发'

export function heatTier(heat: number): HeatTier {
  if (heat >= 80) return '爆发'
  if (heat >= 60) return '热门'
  if (heat >= 40) return '温热'
  return '平静'
}

/* ---------------- 选题标题模板 ---------------- */

type TemplateFn = (item: NewsItem, kw: string) => string

const TITLE_TEMPLATES: Record<Category, TemplateFn[]> = {
  宏观政策: [
    (_item, k) => `${k}落地，对 A 股/美股意味着什么？一文看懂传导链条`,
    (_item, k) => `${k}超预期的背后：全球资产定价正在重写`,
    (_item, k) => `别只盯数字：${k}之后，聪明钱在买什么？`,
  ],
  美股: [
    (_item, k) => `${k}再创新高，美股这轮行情还能走多远？`,
    (_item, k) => `从财报看真相：${k}的含金量到底有多高`,
    (_item, k) => `华尔街一致预期之外：${k}的三个隐藏信号`,
  ],
  A股港股: [
    (_item, k) => `${k}爆发：这轮行情的主线与分歧点`,
    (_item, k) => `资金正在调仓：${k}背后的产业逻辑`,
    (_item, k) => `${k}刷屏之后，散户最该关注的三个问题`,
  ],
  大宗商品: [
    (_item, k) => `${k}异动：供需天平正在向哪边倾斜？`,
    (_item, k) => `一张图看懂${k}这波行情的驱动因子`,
    (_item, k) => `${k}之后，哪些资产会被重新定价？`,
  ],
  科技AI: [
    (_item, k) => `${k}刷屏：AI 军备竞赛进入新赛点`,
    (_item, k) => `拆解${k}：产业链谁最受益？`,
    (_item, k) => `${k}之后，国产替代的下一站在哪里`,
  ],
  监管地缘: [
    (_item, k) => `${k}落地：影响几何？三类资产的不同命运`,
    (_item, k) => `博弈升级：${k}背后的利益链条`,
    (_item, k) => `${k}划重点：自媒体最该讲透的三个要点`,
  ],
  加密货币: [
    (_item, k) => `${k}：机构资金正在改变加密市场`,
    (_item, k) => `${k}背后，链上数据说了什么真话？`,
    (_item, k) => `从${k}看加密资产的宏观定价逻辑`,
  ],
}

const ANGLES: Record<Category, string> = {
  宏观政策: '宏观传导链条（政策 → 利率 → 资产价格）',
  美股: '财报/估值与市场情绪',
  A股港股: '资金面 + 产业主线',
  大宗商品: '供需格局与价格弹性',
  科技AI: '技术突破 → 产业链受益顺序',
  监管地缘: '政策博弈的影响矩阵',
  加密货币: '机构化进程与链上数据',
}

/* ---------------- 平台适配 ---------------- */

const PLATFORM_RULES: { platform: Platform; fit: (item: NewsItem) => number }[] = [
  { platform: '微博快讯', fit: (i) => (i.heat >= 80 ? 3 : i.heat >= 60 ? 2 : 1) },
  { platform: '短视频快评', fit: (i) => (i.category === 'A股港股' || i.category === '美股' || i.category === '大宗商品' ? 2 : 1) + (i.heat >= 70 ? 1 : 0) },
  { platform: '公众号深度', fit: (i) => (i.category === '宏观政策' || i.category === '监管地缘' || i.category === '科技AI' ? 3 : 1) },
  { platform: '直播话题', fit: (i) => (i.heat >= 85 ? 2 : 0) + (i.region === '中国' ? 1 : 0) },
]

export function suggestPlatforms(item: NewsItem): Platform[] {
  return PLATFORM_RULES
    .map((r) => ({ platform: r.platform, score: r.fit(item) }))
    .sort((a, b) => b.score - a.score)
    .filter((r) => r.score > 1)
    .slice(0, 3)
    .map((r) => r.platform)
}

/* ---------------- 推荐理由 ---------------- */

const REGION_LABEL: Record<Region, string> = { 中国: '国内盘', 美国: '美盘', 全球: '全球' }

export function buildReason(item: NewsItem, platforms: Platform[], crossSource: number): string {
  const parts: string[] = []
  parts.push(`热度 ${item.heat}（${heatTier(item.heat)}）`)
  const ageMin = Math.max(1, Math.round((Date.now() - item.publishedAt) / 60_000))
  parts.push(ageMin < 60 ? `${ageMin} 分钟内新鲜事件，时效性强` : `${Math.round(ageMin / 60)} 小时内事件，仍在发酵窗口`)
  if (crossSource > 1) parts.push(`${crossSource} 家信源共振报道，确定性高`)
  parts.push(`属「${item.category}」主线，贴合${REGION_LABEL[item.region]}受众`)
  parts.push(`建议首发 ${platforms[0] ?? '公众号深度'}${platforms[1] ? `，同步${platforms[1]}` : ''}`)
  return parts.join('；') + '。'
}

/* ---------------- 主入口 ---------------- */

function pickKeyword(item: NewsItem): string {
  return item.keywords?.[0] ?? classifyText(item.title, item.summary).hits[0] ?? item.category
}

/** 由热点生成选题推荐（取热度最高的前 limit 条） */
export function generateTopics(items: NewsItem[], limit = 12): TopicRecommendation[] {
  const sorted = [...items].sort((a, b) => b.heat - a.heat).slice(0, limit)
  // 跨源共振统计
  const kwSources = new Map<string, Set<string>>()
  for (const it of items) {
    for (const kw of it.keywords ?? []) {
      const set = kwSources.get(kw) ?? new Set<string>()
      set.add(it.source)
      kwSources.set(kw, set)
    }
  }
  return sorted.map((item, idx) => {
    const kw = pickKeyword(item)
    const templates = TITLE_TEMPLATES[item.category]
    const title = templates[idx % templates.length](item, kw)
    const platforms = suggestPlatforms(item)
    const crossSource = Math.max(1, ...item.keywords.map((k) => kwSources.get(k)?.size ?? 1))
    const score = Math.min(100, Math.round(item.heat * 0.7 + Math.min(8, (crossSource - 1) * 3) + 15))
    return {
      id: `topic-${item.id}`,
      newsId: item.id,
      title,
      reason: buildReason(item, platforms, crossSource),
      category: item.category,
      region: item.region,
      platforms: platforms.length ? platforms : ['公众号深度'],
      score,
      angle: ANGLES[item.category],
      source: item.source,
      heat: item.heat,
      publishedAt: item.publishedAt,
    }
  })
}
