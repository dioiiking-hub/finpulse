/** 全站共享数据类型（design.md §7 数据约定） */

export type Region = '中国' | '美国' | '全球'

export type Category =
  | '宏观政策'
  | '美股'
  | 'A股港股'
  | '大宗商品'
  | '科技AI'
  | '监管地缘'
  | '加密货币'

export const CATEGORIES: Category[] = [
  '宏观政策',
  '美股',
  'A股港股',
  '大宗商品',
  '科技AI',
  '监管地缘',
  '加密货币',
]

export const REGIONS: Region[] = ['中国', '美国', '全球']

/** 分类短标签（分段控件/紧凑空间用） */
export const CATEGORY_SHORT: Record<Category, string> = {
  宏观政策: '宏观',
  美股: '美股',
  A股港股: 'A股港股',
  大宗商品: '大宗',
  科技AI: '科技AI',
  监管地缘: '监管地缘',
  加密货币: '加密',
}

/** 分类色（design.md §2 CategoryTag 色板） */
export const CATEGORY_COLORS: Record<Category, string> = {
  宏观政策: '#D8A94E',
  美股: '#6E9FFF',
  A股港股: '#E5484D',
  大宗商品: '#C7824F',
  科技AI: '#9B8CF2',
  监管地缘: '#43B8A9',
  加密货币: '#D4789E',
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  category: Category
  region: Region
  /** 热度分 0-100（关键词权重 × 来源权重 × 时间衰减 × 跨源共振） */
  heat: number
  /** epoch ms */
  publishedAt: number
  url: string
  keywords: string[]
}

export type FeedStatus = 'live' | 'demo' | 'loading'

export interface FeedState {
  items: NewsItem[]
  status: FeedStatus
  /** 上次成功刷新时间 epoch ms */
  lastUpdated: number
  /** 下一次自动刷新时间 epoch ms */
  nextRefreshAt: number
  /** 最近一次刷新新增的热点（用于 NEW 动画/地图炸环） */
  lastNew: NewsItem[]
}

export type Platform = '公众号深度' | '短视频快评' | '微博快讯' | '直播话题'

export interface TopicRecommendation {
  id: string
  newsId: string
  /** 推荐选题标题 */
  title: string
  /** 推荐理由 */
  reason: string
  category: Category
  region: Region
  /** 适配平台，首个为主适配 */
  platforms: Platform[]
  /** 选题评分 0-100 */
  score: number
  /** 切入角度 */
  angle: string
  source: string
  heat: number
  publishedAt: number
}
