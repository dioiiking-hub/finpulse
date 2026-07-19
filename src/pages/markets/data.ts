/**
 * 市场速览页本地演示数据（markets.md S2/S4/S5/S6）。
 * 共享行情值复用 src/data/markets.ts 的 TICKER_ITEMS（拷贝后本地 tick，不污染共享数据）。
 */
import { TICKER_ITEMS } from '@/data/markets'
import type { MarketQuote } from '@/data/markets'
import type { Category, Region } from '@/lib/types'

/** 与 src/data/markets.ts 相同的确定性伪随机游走（本地副本，data/ 不可改） */
export function makeSpark(seed: number, points = 32, drift = 0.4): number[] {
  let s = seed
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const out: number[] = []
  let v = 50
  for (let i = 0; i < points; i++) {
    v += (rnd() - 0.5) * 6 + drift
    out.push(Math.round(v * 100) / 100)
  }
  return out
}

const t = (id: string): MarketQuote => {
  const q = TICKER_ITEMS.find((x) => x.id === id)
  if (!q) throw new Error(`ticker ${id} missing`)
  return { ...q, spark: [...q.spark] }
}

/* ---------------- S2 指数卡片 ---------------- */

export interface BoardQuote extends MarketQuote {
  /** 交易所 · 城市（顶行小字） */
  sub: string
}

export const CN_CARDS: BoardQuote[] = [
  { ...t('sh-comp'), sub: 'SSE · 上海' },
  { ...t('sz-comp'), sub: 'SZSE · 深圳' },
  { ...t('chinext'), sub: 'SZSE · 深圳' },
  { id: 'star50', name: '科创50', price: 876.32, changePct: 0.95, decimals: 2, market: 'CN', sub: 'SSE · 上海', spark: makeSpark(31) },
  { ...t('hsi'), sub: 'HKEX · 香港' },
  { ...t('hstech'), sub: 'HKEX · 香港' },
]

export const US_CARDS: BoardQuote[] = [
  { ...t('dow'), sub: 'NYSE · 纽约' },
  { ...t('nasdaq'), sub: 'NASDAQ · 纽约' },
  { ...t('sp500'), sub: 'NYSE · 纽约' },
  { id: 'rut2000', name: '罗素2000', price: 2118.76, changePct: -0.22, decimals: 2, market: 'US', sub: 'NYSE · 纽约', spark: makeSpark(32, 32, -0.2) },
  { id: 'sox', name: '费城半导体', price: 5432.1, changePct: 2.31, decimals: 2, market: 'US', sub: 'NASDAQ · 费城', spark: makeSpark(33, 32, 0.6) },
  { id: 'vix', name: 'VIX 恐慌指数', price: 13.42, changePct: -5.89, decimals: 2, market: 'US', sub: 'CBOE · 芝加哥', note: 'VIX 下行 = 风险偏好回升', spark: makeSpark(34, 32, -0.7) },
]

export const GLOBAL_CARDS: BoardQuote[] = [
  { id: 'nikkei', name: '日经225', price: 39220.5, changePct: 0.58, decimals: 2, market: 'US', sub: 'TSE · 东京', spark: makeSpark(35) },
  { id: 'ftse', name: '英国富时100', price: 8265.3, changePct: 0.21, decimals: 2, market: 'US', sub: 'LSE · 伦敦', spark: makeSpark(36) },
  { id: 'dax', name: '德国DAX', price: 18742.1, changePct: 0.44, decimals: 2, market: 'US', sub: 'XETRA · 法兰克福', spark: makeSpark(37) },
]

/** 由当前价与涨跌幅推算昨收；今开/最高/最低为确定性微调（种子来自 id） */
export interface Ohlc {
  open: number
  high: number
  low: number
  prevClose: number
}

export function deriveOhlc(q: MarketQuote, prevClose: number): Ohlc {
  let h = 0
  for (let i = 0; i < q.id.length; i++) h = (h * 31 + q.id.charCodeAt(i)) % 997
  const wob = (k: number) => ((h % 97) / 97 - 0.5) * k
  const open = prevClose * (1 + wob(0.0012))
  const baseHigh = Math.max(q.price, open, prevClose)
  const baseLow = Math.min(q.price, open, prevClose)
  return {
    open,
    high: baseHigh * (1 + 0.0006 + Math.abs(wob(0.002))),
    low: baseLow * (1 - 0.0006 - Math.abs(wob(0.002))),
    prevClose,
  }
}

/* ---------------- S4 汇率 / 大宗 / 加密 ---------------- */

export interface AssetQuote extends MarketQuote {
  /** 价格后缀（如「万亿」） */
  unit?: string
  /** 行内小丸（历史新高 / 24H） */
  badge?: '历史新高' | '24H'
}

export const FX_ROWS: AssetQuote[] = [
  { id: 'usdcny', name: '美元/在岸人民币', price: 7.1265, changePct: -0.18, decimals: 4, market: 'FX', note: 'USDCNY 下行 = 人民币走强', spark: makeSpark(41, 32, -0.3) },
  t('usdcnh'),
  { id: 'dxy', name: '美元指数', price: 104.32, changePct: -0.24, decimals: 2, market: 'FX', spark: makeSpark(42, 32, -0.2) },
  { id: 'eurusd', name: '欧元/美元', price: 1.0854, changePct: 0.21, decimals: 4, market: 'FX', spark: makeSpark(43) },
  { id: 'usdjpy', name: '美元/日元', price: 154.82, changePct: 0.12, decimals: 2, market: 'FX', spark: makeSpark(44) },
]

export const CMDTY_ROWS: AssetQuote[] = [
  { ...t('gold'), badge: '历史新高' },
  { id: 'silver', name: 'COMEX白银', price: 31.28, changePct: 1.85, decimals: 2, market: 'CMDTY', spark: makeSpark(45, 32, 0.5) },
  t('wti'),
  { id: 'brent', name: '布伦特原油', price: 82.67, changePct: 1.78, decimals: 2, market: 'CMDTY', spark: makeSpark(46) },
  { id: 'lme-cu', name: 'LME铜', price: 9876.0, changePct: 1.32, decimals: 1, market: 'CMDTY', spark: makeSpark(47) },
]

export const CRYPTO_ROWS: AssetQuote[] = [
  t('btc'),
  { id: 'eth', name: '以太坊', price: 3512, changePct: 2.87, decimals: 0, market: 'CRYPTO', spark: makeSpark(48, 32, 0.5) },
  { id: 'sol', name: 'SOL', price: 168.4, changePct: 4.15, decimals: 1, market: 'CRYPTO', spark: makeSpark(49, 32, 0.7) },
  { id: 'mcap', name: '加密总市值', price: 2.41, changePct: 2.9, decimals: 2, market: 'CRYPTO', unit: '万亿', badge: '24H', spark: makeSpark(50) },
]

/* ---------------- S5 财经日历 ---------------- */

export interface CalEvent {
  id: string
  /** 北京星期几（0=周日） */
  weekday: number
  dayLabel: string
  /** 北京时间 HH:mm */
  time: string
  name: string
  region: Exclude<Region, '全球'>
  stars: 2 | 3
  forecast: string
  previous: string
}

export const CAL_EVENTS: CalEvent[] = [
  { id: 'fomc', weekday: 3, dayLabel: '周三', time: '02:00', name: '美联储 FOMC 利率决议', region: '美国', stars: 3, forecast: '5.25–5.50%', previous: '5.25–5.50%' },
  { id: 'cpi', weekday: 3, dayLabel: '周三', time: '20:30', name: '美国 11 月 CPI 月率', region: '美国', stars: 3, forecast: '+0.2%', previous: '+0.3%' },
  { id: 'lpr', weekday: 4, dayLabel: '周四', time: '09:15', name: '中国 LPR 报价（1Y/5Y）', region: '中国', stars: 2, forecast: '3.10%/3.60%', previous: '持平' },
  { id: 'jobless', weekday: 4, dayLabel: '周四', time: '20:30', name: '美国初请失业金人数', region: '美国', stars: 2, forecast: '22.5万', previous: '22.1万' },
  { id: 'pmi', weekday: 5, dayLabel: '周五', time: '09:30', name: '中国官方制造业 PMI', region: '中国', stars: 2, forecast: '50.1', previous: '50.3' },
  { id: 'nfp', weekday: 5, dayLabel: '周五', time: '21:30', name: '美国非农就业报告', region: '美国', stars: 3, forecast: '+18.5万', previous: '+21.2万' },
]

/* ---------------- S6 中美联动观察 ---------------- */

export interface Insight {
  id: string
  text: string
  tag: Category
}

export const INSIGHTS: Insight[] = [
  { id: 'semi', text: '隔夜美股半导体领涨 +2.31%（费半）→ 关注 A 股芯片与算力板块开盘联动', tag: '科技AI' },
  { id: 'fx-cny', text: '美元指数回落 0.24%、人民币升破 7.12 → 人民币资产压力缓解，北向资金延续净流入概率上升', tag: '宏观政策' },
  { id: 'gold-ath', text: '金价续创历史新高 → 黄金股与避险题材热度上行，「还能上车吗」类选题互动窗口打开', tag: '大宗商品' },
]
