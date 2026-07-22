import type { Category, NewsItem, Platform, Region, TopicRecommendation } from '@/lib/types'
import { generateTopics, timeDecay } from '@/lib/recommend'

/**
 * 选题推荐页数据模型（topics.md S3/S4）：
 * - 7 张策展演示卡（design 完整文案，映射到演示新闻流）；
 * - 其余选题由 lib/recommend 的 generateTopics 实时生成后在此富化
 *   （等级、四维评分、预估形式、建议大纲、备选标题、受众画像、最佳发布时间）。
 */

export type Grade = 'S' | 'A' | 'B'

export interface ScoreDims {
  时效: number
  热度: number
  受众: number
  差异化: number
}

export const DIM_TIPS: { key: keyof ScoreDims; tip: string }[] = [
  { key: '时效', tip: '距热点爆发时间越近分越高，2 小时后衰减' },
  { key: '热度', tip: '关键词权重 × 来源权重 × 时间衰减 × 跨源共振' },
  { key: '受众', tip: '题材覆盖人群广度与账号粉丝画像重合度' },
  { key: '差异化', tip: '同质化内容越少分越高，稀缺视角加分' },
]

/** 关联热点引用：优先按 newsId 命中当前流，其次按关键词匹配标题/摘要 */
export interface RelatedRef {
  title: string
  keyword?: string
  newsId?: string
  /** 未命中时的回退展示 */
  fallbackHeat?: number
  fallbackSource?: string
}

export interface ResolvedRelated {
  title: string
  heat: number | null
  source: string | null
  publishedAt: number | null
  newsId: string | null
  /** 原始报道链接（http 开头才视为有效），无则回退站内定位 */
  url: string | null
}

export interface RichTopic {
  id: string
  newsId: string | null
  grade: Grade
  title: string
  /** 推荐理由（**短语** 标记 gold 高亮；数字自动高亮） */
  reason: string
  category: Category
  region: Region
  platforms: Platform[]
  estimate: string
  heat: number
  /** 综合分（四维加权，用于「综合推荐」排序） */
  score: number
  dims: ScoreDims
  angle: string
  related: ResolvedRelated[]
  outline: string[]
  altTitles: string[]
  bestTime: string
  audience: string
  source: string
  publishedAt: number
  /** 爆发级热点的「黄金 2 小时」截止时刻（epoch ms），非爆发为 null */
  goldenUntil: number | null
}

/* ---------------- 工具 ---------------- */

export function gradeOf(heat: number): Grade {
  if (heat >= 82) return 'S'
  if (heat >= 68) return 'A'
  return 'B'
}

function hashStr(s: string): number {
  let h = 7
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function compositeScore(d: ScoreDims): number {
  return Math.round(d.时效 * 0.25 + d.热度 * 0.35 + d.受众 * 0.2 + d.差异化 * 0.2)
}

function resolveRelated(ref: RelatedRef, items: NewsItem[]): ResolvedRelated {
  const hit = items.find(
    (i) =>
      (ref.newsId && i.id === ref.newsId) ||
      (ref.keyword && `${i.title} ${i.summary}`.includes(ref.keyword)),
  )
  if (hit) {
    return {
      title: ref.title,
      heat: hit.heat,
      source: hit.source,
      publishedAt: hit.publishedAt,
      newsId: hit.id,
      url: hit.url && hit.url.startsWith('http') ? hit.url : null,
    }
  }
  return {
    title: ref.title,
    heat: ref.fallbackHeat ?? null,
    source: ref.fallbackSource ?? null,
    publishedAt: null,
    newsId: ref.newsId ?? null,
    url: null,
  }
}

/* ---------------- 生成选题的富化 ---------------- */

const ESTIMATE_BY_PLATFORM: Record<Platform, string> = {
  公众号深度: '2000字深度稿 · 配图 3 张',
  短视频快评: '60s 口播 + 数据图卡',
  微博快讯: '快讯 + 一图看懂',
  直播话题: '直播连线 30 分钟 · 提纲 5 条',
  播客: '40分钟对谈 · 对谈提纲 5 条',
}

const AUDIENCE_BY_CATEGORY: Record<Category, string> = {
  宏观政策: '核心受众：25–45 岁，关注宏观与资产配置的读者',
  美股: '核心受众：持有美股/QDII 的中青年投资者，对财报与估值敏感',
  A股港股: '核心受众：A 股/港股活跃交易者，关注资金面与板块轮动',
  大宗商品: '核心受众：关注黄金、原油配置的大众投资者与避险人群',
  科技AI: '核心受众：科技行业从业者与成长赛道投资者',
  监管地缘: '核心受众：关注政策走向的专业投资者与行业从业者',
  加密货币: '核心受众：加密资产持有者与关注机构化进程的人群',
}

const BEST_TIME_BY_PLATFORM: Record<Platform, string> = {
  公众号深度: '今日 20:00 前发布 —— 覆盖公众号晚间阅读高峰窗口',
  短视频快评: '今日 18:30 前发布 —— 卡位晚通勤与睡前双流量高峰',
  微博快讯: '2 小时内发布 —— 快讯生命周期短，优先抢占讨论窗口',
  直播话题: '今日 19:30 开播 —— 覆盖晚间在线高峰，预留预热半小时',
  播客: '周四 20:00 上线 —— 卡位晚间收听高峰，预留周末二次传播窗口',
}

const REGION_MARKET: Record<Region, string> = {
  中国: 'A 股/港股与人民币资产',
  美国: '美股与美元资产',
  全球: '全球大类资产',
}

function dimsFromItem(item: NewsItem): ScoreDims {
  const h = hashStr(item.id + item.title)
  return {
    时效: Math.round(Math.max(35, Math.min(99, 30 + 70 * timeDecay(item.publishedAt)))),
    热度: item.heat,
    受众: 55 + (h % 36),
    差异化: 50 + ((h >>> 8) % 41),
  }
}

function outlineFor(t: { title: string; region: Region }, kw: string): string[] {
  return [
    `事件复盘：${t.title.slice(0, 18)} 的来龙去脉`,
    `驱动拆解：${kw} 背后的核心变量与关键数据`,
    `传导路径：对${REGION_MARKET[t.region]}的影响链条`,
    `操作视角：不同持仓者的应对策略与工具`,
    `风险提示：需要持续跟踪的三个反转信号`,
  ]
}

function altTitlesFor(_t: { title: string }, kw: string): string[] {
  return [
    `${kw}刷屏之后，最该搞懂的三个问题`,
    `一图看懂：${kw}如何影响你的持仓`,
    `复盘：上次${kw}之后，市场走出了什么行情`,
  ]
}

/** 由 lib 推荐结果富化为页面使用的 RichTopic */
export function enrichRecommendation(rec: TopicRecommendation, items: NewsItem[]): RichTopic {
  const item = items.find((i) => i.id === rec.newsId)
  const dims = item
    ? dimsFromItem(item)
    : { 时效: 60, 热度: rec.heat, 受众: 55 + (hashStr(rec.id) % 36), 差异化: 50 + ((hashStr(rec.id) >>> 8) % 41) }
  const kw = item?.keywords?.[0] ?? rec.category
  const relatedRefs: RelatedRef[] = []
  if (item) {
    relatedRefs.push({ title: item.title, newsId: item.id })
    // 跨源共振：同关键词的其他信源
    for (const other of items) {
      if (other.id === item.id) continue
      if (relatedRefs.length >= 3) break
      if (other.keywords.some((k) => item.keywords.includes(k))) {
        relatedRefs.push({ title: other.title, newsId: other.id })
      }
    }
  }
  const primary = rec.platforms[0] ?? '公众号深度'
  return {
    id: rec.id,
    newsId: rec.newsId,
    grade: gradeOf(rec.heat),
    title: rec.title,
    reason: rec.reason,
    category: rec.category,
    region: rec.region,
    platforms: rec.platforms,
    estimate: ESTIMATE_BY_PLATFORM[primary],
    heat: rec.heat,
    score: compositeScore(dims),
    dims,
    angle: rec.angle,
    related: relatedRefs.map((r) => resolveRelated(r, items)),
    outline: outlineFor(rec, kw),
    altTitles: altTitlesFor(rec, kw),
    bestTime: BEST_TIME_BY_PLATFORM[primary],
    audience: AUDIENCE_BY_CATEGORY[rec.category],
    source: rec.source,
    publishedAt: rec.publishedAt,
    goldenUntil: rec.heat >= 80 ? rec.publishedAt + 2 * 3_600_000 : null,
  }
}

/** 由新闻条目直接生成一条富化选题（?focus= 指向未上榜热点时兜底） */
export function enrichFromNewsItem(item: NewsItem, items: NewsItem[]): RichTopic {
  const [rec] = generateTopics([item], 1)
  if (rec) return enrichRecommendation(rec, items)
  // 理论不可达，保底结构
  const dims = dimsFromItem(item)
  const kw = item.keywords[0] ?? item.category
  return {
    id: `topic-${item.id}`,
    newsId: item.id,
    grade: gradeOf(item.heat),
    title: item.title,
    reason: item.summary,
    category: item.category,
    region: item.region,
    platforms: ['公众号深度'],
    estimate: ESTIMATE_BY_PLATFORM.公众号深度,
    heat: item.heat,
    score: compositeScore(dims),
    dims,
    angle: '事件驱动的一线解读',
    related: [{ title: item.title, heat: item.heat, source: item.source, publishedAt: item.publishedAt, newsId: item.id }],
    outline: outlineFor(item, kw),
    altTitles: altTitlesFor(item, kw),
    bestTime: BEST_TIME_BY_PLATFORM.公众号深度,
    audience: AUDIENCE_BY_CATEGORY[item.category],
    source: item.source,
    publishedAt: item.publishedAt,
    goldenUntil: item.heat >= 80 ? item.publishedAt + 2 * 3_600_000 : null,
  }
}

/* ---------------- 7 张策展演示卡（topics.md 完整文案） ---------------- */

interface CuratedDef {
  newsId?: string
  grade: Grade
  title: string
  reason: string
  category: Category
  region: Region
  platforms: Platform[]
  estimate: string
  heat: number
  dims: ScoreDims
  angle: string
  related: RelatedRef[]
  outline: string[]
  altTitles: string[]
  bestTime: string
  audience: string
  /** 未命中流时的发布时间回退（分钟前） */
  minutesAgo: number
}

const CURATED: CuratedDef[] = [
  {
    newsId: 'mock-001',
    grade: 'S',
    title: '美联储降息预期重燃：对 A 股的三大传导路径',
    reason:
      '宏观政策类当前热度全站 **TOP3**；沃勒鸽派表态 + 美债收益率跌破 **4.2%** 形成跨源共振（**3 信源**同题）；中美联动题材覆盖双市场受众，近 7 日同类选题平均阅读高出均值 **42%**。',
    category: '宏观政策',
    region: '美国',
    platforms: ['公众号深度', '短视频快评'],
    estimate: '2000字深度稿',
    heat: 87,
    dims: { 时效: 92, 热度: 87, 受众: 78, 差异化: 64 },
    angle: '从「降息交易」的资产轮动切入，对照 2019 年预防式降息行情做复盘。',
    related: [
      { title: '沃勒：年内降息是合适的', keyword: '降息', fallbackHeat: 94, fallbackSource: '华尔街见闻' },
      { title: '美债收益率跌破 4.2%', keyword: '美债', fallbackHeat: 82, fallbackSource: 'Reuters' },
      { title: 'PPI 低于预期', keyword: '通胀', fallbackHeat: 78, fallbackSource: '金十数据' },
    ],
    outline: [
      '信号复盘：沃勒表态与利率掉期定价变化',
      '传导路径一：美债收益率 → 成长股估值',
      '路径二：美元走弱 → 人民币资产与北向资金',
      '路径三：风险偏好 → 板块轮动顺序',
      '风险提示：通胀反复的三个观察指标',
    ],
    altTitles: ['降息预期又回来了，A 股这次会跟吗？', '三个信号看懂「降息交易」重启', '2019 年重演？复盘预防式降息行情'],
    bestTime: '今日 20:00 前发布 —— 覆盖美股盘前讨论高峰与公众号晚间阅读高峰双窗口',
    audience: '核心受众：25–45 岁，关注宏观与资产配置的公众号读者',
    minutesAgo: 8,
  },
  {
    newsId: 'mock-002',
    grade: 'S',
    title: '英伟达财报炸裂背后：AI 行情的三个新信号',
    reason:
      '科技AI 类热度环比 **+35%**；财报类短视频 **30 秒**完播率高于均值；「营收 **+94%**」数字冲击力强，天然适合短视频口播封面标题。',
    category: '科技AI',
    region: '美国',
    platforms: ['短视频快评', '微博快讯'],
    estimate: '60s 口播 + 数据图卡',
    heat: 84,
    dims: { 时效: 95, 热度: 84, 受众: 82, 差异化: 58 },
    angle: '不聊股价聊供应链：从台积电 CoWoS 产能与云厂商资本开支看行情持续性。',
    related: [{ title: '英伟达 Q3 营收同比 +94%', keyword: '英伟达', fallbackHeat: 91, fallbackSource: 'CNBC' }],
    outline: [
      '财报速览：营收、毛利率与指引的三个超预期点',
      '信号一：数据中心营收结构变化说明什么',
      '信号二：云厂商资本开支仍在加码',
      '信号三：供应链产能（CoWoS）成为新瓶颈',
      '风险提示：估值透支与出口管制变量',
    ],
    altTitles: ['营收 +94%，英伟达凭什么还在加速？', 'AI 行情下半场，盯紧这三个信号', '不看股价看产能：英伟达财报的隐藏信息'],
    bestTime: '今日 18:30 前发布 —— 卡位晚通勤与睡前双流量高峰，蹭财报讨论热度',
    audience: '核心受众：科技行业从业者与 AI 赛道投资者，短视频重度用户',
    minutesAgo: 15,
  },
  {
    newsId: 'mock-003',
    grade: 'A',
    title: '金价再创历史新高：普通人还能上车吗？',
    reason:
      '大宗类连续**三日**占据热榜；黄金题材大众情绪点强、评论区互动率高；「历史新高 + 还能不能买」是搜索型长尾选题，生命周期 **3–5 天**。',
    category: '大宗商品',
    region: '全球',
    platforms: ['微博快讯', '短视频快评'],
    estimate: '快讯 + 一图看懂',
    heat: 79,
    dims: { 时效: 74, 热度: 79, 受众: 88, 差异化: 61 },
    angle: '央行购金 + 降息预期双驱动框架，对比 2020 年那轮金顶的异同。',
    related: [{ title: 'COMEX 黄金突破 2,390 美元', keyword: '黄金', fallbackHeat: 89, fallbackSource: 'MarketWatch' }],
    outline: [
      '行情复盘：本轮金价上涨的三个阶段',
      '驱动一：全球央行连续购金的底层逻辑',
      '驱动二：降息预期与实际利率下行',
      '普通人上车的三种方式与成本对比',
      '风险提示：追高的历史回撤数据',
    ],
    altTitles: ['金价新高，现在上车还来得及吗？', '一图看懂：黄金为什么涨个不停', '央行都在买黄金，普通人跟不跟？'],
    bestTime: '2 小时内发布 —— 快讯生命周期短，抢占「黄金」搜索流量窗口',
    audience: '核心受众：关注黄金配置的大众投资者，25–55 岁泛理财人群',
    minutesAgo: 42,
  },
  {
    newsId: 'mock-004',
    grade: 'A',
    title: '成交额重返万亿：这轮反弹和上次有什么不同？',
    reason:
      'A股情绪拐点，散户关注度陡增；「重返万亿」是强记忆锚点；数据对比类选题在公众号的转发率高，差异化空间 **71 分**。',
    category: 'A股港股',
    region: '中国',
    platforms: ['公众号深度'],
    estimate: '数据复盘长文',
    heat: 76,
    dims: { 时效: 80, 热度: 76, 受众: 74, 差异化: 71 },
    angle: '北向、两融、ETF 三维拆解资金结构，回答「这次是谁在用钱投票」。',
    related: [{ title: '沪指收涨 0.82%，成交额重返万亿', keyword: '沪指', fallbackHeat: 87, fallbackSource: '东方财富' }],
    outline: [
      '数据复盘：万亿成交的历史出现频次与后续走势',
      '资金拆解一：北向资金的行业流向',
      '资金拆解二：两融余额与杠杆情绪',
      '资金拆解三：ETF 申购赎回的机构信号',
      '对照上次：三个相同点与两个本质不同',
    ],
    altTitles: ['万亿成交回来了，这次是谁在买？', '数据说话：这轮反弹和上次的五个不同', '成交量不会骗人：资金结构三维拆解'],
    bestTime: '今日 20:00 前发布 —— 覆盖公众号晚间阅读高峰，收盘复盘黄金档',
    audience: '核心受众：A 股活跃交易者和基民，关注资金面信号',
    minutesAgo: 58,
  },
  {
    newsId: 'mock-005',
    grade: 'A',
    title: '程序化交易新规来了，量化基金何去何从？',
    reason:
      '监管类稀缺选题，同质化内容少，差异化空间 **86 分**；政策解读是账号专业度人设的加分项；适合延展为直播连线。',
    category: '监管地缘',
    region: '中国',
    platforms: ['公众号深度', '直播话题'],
    estimate: '解读稿 + 直播连线量化从业者',
    heat: 72,
    dims: { 时效: 78, 热度: 72, 受众: 60, 差异化: 86 },
    angle: '规则要点速览 → 高频策略影响 → 对散户是不是利好，三段式。',
    related: [{ title: '证监会就程序化交易新规公开征求意见', keyword: '证监会', fallbackHeat: 84, fallbackSource: '财联社' }],
    outline: [
      '新规要点速览：认定标准、报告义务与差异化收费',
      '高频策略的直接影响：成本模型重算',
      '量化行业的三种应对路径推演',
      '对散户是不是利好：流动性与公平性之辩',
      '直播连线预告：量化从业者的真实反馈',
    ],
    altTitles: ['量化新规划重点：谁受益谁受伤', '程序化交易监管落地，高频时代终结？', '三分钟读懂程序化交易新规'],
    bestTime: '今日 19:30 直播连线 —— 解读稿当日 17:00 前发布预热',
    audience: '核心受众：持有量化产品的中高净值投资者与行业从业者',
    minutesAgo: 74,
  },
  {
    grade: 'B',
    title: '人民币升破 7.12：出口企业该怎么办？',
    reason:
      '汇率话题受众精准（外贸/跨境人群）；可与汇率避险工具科普联动做成系列；时效窗口较长，适合排期填充。',
    category: '宏观政策',
    region: '中国',
    platforms: ['微博快讯'],
    estimate: '快讯 + 评论互动',
    heat: 64,
    dims: { 时效: 66, 热度: 64, 受众: 62, 差异化: 70 },
    angle: '结售汇节奏建议 + 三种避险工具箱，实用导向。',
    related: [{ title: '在岸人民币升破 7.12 关口', keyword: '人民币', fallbackHeat: 71, fallbackSource: '华尔街见闻' }],
    outline: [
      '行情速览：升值背后的美元走弱与结汇盘',
      '出口企业影响测算：利润率敏感区间',
      '工具箱一：远期结售汇的适用场景',
      '工具箱二：期权组合与跨境人民币结算',
      '节奏建议：分批结汇的参考框架',
    ],
    altTitles: ['人民币又升值，出口老板的三本账', '汇率 7.12 时代，外贸人如何锁利？', '一图看懂出口企业的汇率避险工具箱'],
    bestTime: '明日 12:00 前发布均可 —— 时效窗口长，适合午间阅读档排期',
    audience: '核心受众：外贸/跨境从业者与企业主，关注汇率避险实操',
    minutesAgo: 96,
  },
  {
    newsId: 'mock-013',
    grade: 'A',
    title: '深聊丨出口管制升级之后，钱会往哪去？',
    reason:
      '监管地缘类稀缺选题，同质化解读少，差异化空间 **83 分**；热度 **77** 避开快讯红海、正处深度解读窗口；管制清单与实体清单议题信息密度高，适合 **40 分钟对谈**展开，嘉宾观点碰撞空间大。',
    category: '监管地缘',
    region: '美国',
    platforms: ['播客', '公众号深度'],
    estimate: '40分钟对谈 · 对谈提纲 5 条',
    heat: 77,
    dims: { 时效: 70, 热度: 77, 受众: 64, 差异化: 83 },
    angle: '不逐条解读清单，聚焦资金流向推演：避险与进攻两类资金如何再定价。',
    related: [
      { title: '美商务部更新半导体出口管制清单，新增 12 家中国实体', keyword: '出口管制', fallbackHeat: 70, fallbackSource: 'Bloomberg' },
      { title: '科创 50 指数五连阳，半导体设备板块掀涨停潮', keyword: '国产替代', fallbackHeat: 67, fallbackSource: '东方财富' },
      { title: '欧盟通过对美 950 亿欧元商品反制关税清单', keyword: '关税', fallbackHeat: 62, fallbackSource: 'Reuters' },
    ],
    outline: [
      '开场复盘：本轮出口管制清单到底升级了什么',
      '对谈一：实体清单扩容对产业链的短期冲击',
      '对谈二：国产替代的受益顺序与时间表',
      '对谈三：避险与进攻两类资金的再配置路径',
      '收尾展望：全球供应链重构的三个长期观察信号',
    ],
    altTitles: ['从出口管制聊起：普通投资者能学到什么', '出口管制的另一面：那些被忽略的长期变量', '实体清单再扩容，聪明钱正在往哪走？'],
    bestTime: '周四 20:00 上线 —— 卡位晚间收听高峰，预留周末二次传播窗口',
    audience: '核心受众：关注政策走向的专业投资者与半导体产业链从业者，播客通勤收听人群',
    minutesAgo: 71,
  },
]

/* ---------------- 汇总构建 ---------------- */

/** 构建页面完整选题列表：7 张策展卡 + 实时生成卡（去重后补足至 24 条） */
export function buildTopics(items: NewsItem[], targetCount = 24): RichTopic[] {
  const now = Date.now()
  const curated: RichTopic[] = CURATED.map((c, i) => {
    const hit = c.newsId ? items.find((it) => it.id === c.newsId) : undefined
    const publishedAt = hit?.publishedAt ?? now - c.minutesAgo * 60_000
    return {
      id: `curated-${i + 1}`,
      newsId: hit?.id ?? c.newsId ?? null,
      grade: c.grade,
      title: c.title,
      reason: c.reason,
      category: c.category,
      region: c.region,
      platforms: c.platforms,
      estimate: c.estimate,
      heat: c.heat,
      score: compositeScore(c.dims),
      dims: c.dims,
      angle: c.angle,
      related: c.related.map((r) => resolveRelated(r, items)),
      outline: c.outline,
      altTitles: c.altTitles,
      bestTime: c.bestTime,
      audience: c.audience,
      source: hit?.source ?? c.related[0]?.fallbackSource ?? '华尔街见闻',
      publishedAt,
      goldenUntil: c.heat >= 80 ? publishedAt + 2 * 3_600_000 : null,
    }
  })

  const usedNews = new Set(curated.map((t) => t.newsId).filter(Boolean) as string[])
  const generated = generateTopics(items, 36)
    .filter((rec) => !usedNews.has(rec.newsId))
    .map((rec) => enrichRecommendation(rec, items))

  return [...curated, ...generated].slice(0, targetCount)
}
