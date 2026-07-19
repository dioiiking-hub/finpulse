/**
 * 演示行情数据 + 市场开闭市状态推算（design.md §7）。
 * 纯前端演示值；sparkline 为确定性伪随机序列（种子固定，跨渲染稳定）。
 */

export type MarketKind = 'CN' | 'HK' | 'US' | 'FX' | 'CMDTY' | 'CRYPTO'

export interface MarketQuote {
  /** 路由锚点 / 卡片 id */
  id: string
  name: string
  price: number
  changePct: number
  decimals: number
  market: MarketKind
  /** 反向指标说明（如 VIX），正常资产留空 */
  note?: string
  spark: number[]
}

/** 确定性伪随机游走序列 */
function makeSpark(seed: number, points = 32, drift = 0.4): number[] {
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

/** TickerTape 12 项（home.md S2 演示值） */
export const TICKER_ITEMS: MarketQuote[] = [
  { id: 'sh-comp', name: '上证指数', price: 3087.52, changePct: 0.82, decimals: 2, market: 'CN', spark: makeSpark(11) },
  { id: 'sz-comp', name: '深证成指', price: 9876.44, changePct: 1.13, decimals: 2, market: 'CN', spark: makeSpark(12) },
  { id: 'chinext', name: '创业板指', price: 1923.18, changePct: 1.47, decimals: 2, market: 'CN', spark: makeSpark(13) },
  { id: 'hsi', name: '恒生指数', price: 19842.33, changePct: 1.21, decimals: 2, market: 'HK', spark: makeSpark(14) },
  { id: 'hstech', name: '恒生科技', price: 4398.55, changePct: 1.9, decimals: 2, market: 'HK', spark: makeSpark(15) },
  { id: 'dow', name: '道琼斯', price: 39872.15, changePct: 0.34, decimals: 2, market: 'US', spark: makeSpark(16) },
  { id: 'nasdaq', name: '纳斯达克', price: 18654.2, changePct: 1.18, decimals: 2, market: 'US', spark: makeSpark(17) },
  { id: 'sp500', name: '标普500', price: 5872.44, changePct: 0.67, decimals: 2, market: 'US', spark: makeSpark(18) },
  { id: 'gold', name: 'COMEX黄金', price: 2391.2, changePct: 1.12, decimals: 1, market: 'CMDTY', spark: makeSpark(19) },
  { id: 'wti', name: 'WTI原油', price: 78.42, changePct: 2.05, decimals: 2, market: 'CMDTY', spark: makeSpark(20) },
  { id: 'usdcnh', name: '美元/离岸人民币', price: 7.1188, changePct: -0.16, decimals: 4, market: 'FX', spark: makeSpark(21, 32, -0.3) },
  { id: 'btc', name: '比特币', price: 67230, changePct: 3.42, decimals: 0, market: 'CRYPTO', spark: makeSpark(22) },
]

/** 中美瞭望 · 中国卡（home.md S4） */
export const CN_BOARD: MarketQuote[] = [
  TICKER_ITEMS[0],
  TICKER_ITEMS[1],
  TICKER_ITEMS[3],
  TICKER_ITEMS[4],
]

/** 中美瞭望 · 美国卡（home.md S4） */
export const US_BOARD: MarketQuote[] = [
  TICKER_ITEMS[5],
  TICKER_ITEMS[6],
  TICKER_ITEMS[7],
  { id: 'sox', name: '费城半导体', price: 5412.87, changePct: 2.31, decimals: 2, market: 'US', spark: makeSpark(23) },
]

export type MarketSession = 'open' | 'closed' | 'pre' | 'break'

export interface MarketStatus {
  key: 'A股' | '港股' | '美股'
  session: MarketSession
  label: string
}

/** 以北京时间（Asia/Shanghai，UTC+8）推算分钟数与星期 */
function bjNow(now = new Date()) {
  const bj = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60_000)
  return { minutes: bj.getHours() * 60 + bj.getMinutes(), day: bj.getDay() }
}

/**
 * 开闭市推算（北京时间，简化规则，不考虑节假日/冬令时切换）：
 * A股 工作日 9:30–11:30 / 13:00–15:00（午间休市）
 * 港股 工作日 9:30–12:00 / 13:00–16:00
 * 美股 夏令时 21:30–次日 4:00
 */
export function getMarketStatuses(now = new Date()): MarketStatus[] {
  const { minutes, day } = bjNow(now)
  const weekday = day >= 1 && day <= 5

  const aShare: MarketSession = !weekday
    ? 'closed'
    : (minutes >= 570 && minutes < 690) || (minutes >= 780 && minutes < 900)
      ? 'open'
      : minutes >= 690 && minutes < 780
        ? 'break'
        : minutes < 570
          ? 'pre'
          : 'closed'

  const hk: MarketSession = !weekday
    ? 'closed'
    : (minutes >= 570 && minutes < 720) || (minutes >= 780 && minutes < 960)
      ? 'open'
      : minutes >= 720 && minutes < 780
        ? 'break'
        : minutes < 570
          ? 'pre'
          : 'closed'

  // 美股（美东夏令时 ≈ 北京 21:30–04:00）；周六全天、周日上午为休市
  const usClosed =
    day === 6 || (day === 0 && minutes < 1290) || (day === 1 && minutes < 240)
  const us: MarketSession = usClosed
    ? 'closed'
    : minutes >= 1290 || minutes < 240
      ? 'open'
      : minutes >= 240 && minutes < 1290
        ? 'pre'
        : 'closed'

  const labelOf = (s: MarketSession) =>
    s === 'open' ? '交易中' : s === 'pre' ? '盘前' : s === 'break' ? '午休' : '已收盘'

  return [
    { key: 'A股', session: aShare, label: labelOf(aShare) },
    { key: '港股', session: hk, label: labelOf(hk) },
    { key: '美股', session: us, label: labelOf(us) },
  ]
}

/** 格式化价格（千分位 + 固定小数位） */
export function fmtPrice(q: Pick<MarketQuote, 'price' | 'decimals'>): string {
  return q.price.toLocaleString('en-US', {
    minimumFractionDigits: q.decimals,
    maximumFractionDigits: q.decimals,
  })
}

/** 格式化涨跌幅（显式符号） */
export function fmtChange(pct: number): string {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}
