import { useSyncExternalStore } from 'react'
import { TICKER_ITEMS } from '@/data/markets'
import type { MarketQuote } from '@/data/markets'
import { beijingClock } from '@/lib/time'

/**
 * 真实行情快照层（fix-v2）：
 * - 插件定时任务每 30 分钟生成 public/data/market-snapshot.json（iFinD / Yahoo Finance），
 *   构建后经 /data/market-snapshot.json 访问；
 * - useMarketSnapshot()：mount 时 fetch（5s 超时），成功后把 quotes 按 id 叠加到
 *   markets.ts 静态数组上（price/changePct/spark/note 用快照值，name/decimals/market 保留本地），
 *   并每 30 分钟自动重取（单例 store，多组件共享同一份状态与同一只定时器）；
 * - 失败/超时 → quotes 为 null，各组件无缝回退现有演示数据；
 * - quotes 的 key 与 TICKER_ITEMS id 一致（外加 vix 等快照独有品种，用本地元信息补全）。
 */

const SNAPSHOT_URL = 'data/market-snapshot.json'
/**
 * GitHub Actions 每小时刷新的远程快照。
 * 部署前把下面的占位替换为你的仓库，格式：<用户名>/<仓库名>@<分支>
 * 拉取顺序：raw.githubusercontent（缓存约 5 分钟）→ jsDelivr CDN（备用，缓存较久）→ 站点内置快照。
 */
export const REMOTE_SNAPSHOT_REPO = 'dioiiking-hub/finpulse@main'
const REMOTE_URLS: string[] = REMOTE_SNAPSHOT_REPO.includes('YOUR_GITHUB_USER')
  ? []
  : (() => {
      const [repo, branch = 'main'] = REMOTE_SNAPSHOT_REPO.split('@')
      const path = 'public/data/market-snapshot.json'
      return [
        `https://raw.githubusercontent.com/${repo}/${branch}/${path}`,
        `https://cdn.jsdelivr.net/gh/${repo}@${branch}/${path}`,
      ]
    })()
const FETCH_TIMEOUT_MS = 5_000
export const SNAPSHOT_REFRESH_MS = 30 * 60_000

/** 快照 JSON 单个品种（字段均可选，缺项回落本地演示值） */
interface SnapshotQuote {
  price?: number
  changePct?: number
  spark?: number[]
  /** 该品种的行情日期（如 2026-07-18） */
  asOf?: string
  source?: string
  /** 替代行情等说明（如 hstech 以 ETF 替代指数） */
  note?: string
}

interface SnapshotJson {
  asOf?: string
  sources?: string[]
  quotes?: Record<string, SnapshotQuote>
}

/** 快照里有、TICKER_ITEMS 没有的品种：本地补全 name/decimals/market */
const EXTRA_LOCAL: Record<string, Pick<MarketQuote, 'id' | 'name' | 'decimals' | 'market'>> = {
  vix: { id: 'vix', name: 'VIX 恐慌指数', decimals: 2, market: 'US' },
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

/** 单条叠加：price/changePct/spark/note 用快照值，其余保留本地 */
function overlayOne(q: MarketQuote, s: SnapshotQuote | undefined): MarketQuote {
  if (!s || !isNum(s.price)) return q
  return {
    ...q,
    price: s.price,
    changePct: isNum(s.changePct) ? s.changePct : q.changePct,
    spark: Array.isArray(s.spark) && s.spark.length >= 2 ? s.spark : q.spark,
    ...(s.note ? { note: s.note } : {}),
  }
}

/** 由快照 JSON 构建完整叠加数组：TICKER_ITEMS 叠加 + 快照独有品种（vix 等） */
function buildQuotes(data: SnapshotJson): MarketQuote[] {
  const map = data.quotes ?? {}
  const out = TICKER_ITEMS.map((q) => overlayOne(q, map[q.id]))
  for (const [id, meta] of Object.entries(EXTRA_LOCAL)) {
    const s = map[id]
    if (s && isNum(s.price)) {
      out.push(overlayOne({ ...meta, price: s.price, changePct: 0, spark: [s.price, s.price] }, s))
    }
  }
  return out
}

/* ---------------- 单例 store（30 分钟重取） ---------------- */

interface SnapshotState {
  quotes: MarketQuote[] | null
  asOf: string | null
  sources: string[]
}

let state: SnapshotState = { quotes: null, asOf: null, sources: [] }
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null
let inflight = false

function emit() {
  listeners.forEach((l) => l())
}

async function fetchJson(url: string): Promise<SnapshotJson> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as SnapshotJson
    if (!data || typeof data !== 'object' || !data.quotes) throw new Error('bad snapshot')
    return data
  } finally {
    clearTimeout(t)
  }
}

async function fetchSnapshot(): Promise<void> {
  if (inflight) return
  inflight = true
  try {
    // 优先 GitHub Actions 远程快照（raw → jsDelivr），失败回退站点内置快照
    let data: SnapshotJson | null = null
    for (const url of REMOTE_URLS) {
      try {
        data = await fetchJson(`${url}?t=${Date.now()}`)
        break
      } catch {
        data = null
      }
    }
    if (!data) data = await fetchJson(SNAPSHOT_URL)
    state = {
      quotes: buildQuotes(data),
      asOf: typeof data.asOf === 'string' ? data.asOf : null,
      sources: Array.isArray(data.sources)
        ? data.sources.filter((s): s is string => typeof s === 'string')
        : [],
    }
    emit()
  } catch {
    // 失败/超时：无历史快照时保持 null（组件回退演示数据）；有历史快照则保留旧值
  } finally {
    inflight = false
  }
}

function start() {
  if (timer) return
  void fetchSnapshot()
  timer = setInterval(() => void fetchSnapshot(), SNAPSHOT_REFRESH_MS)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  if (listeners.size === 1) start()
  return () => {
    listeners.delete(fn)
    if (listeners.size === 0) stop()
  }
}

function getState(): SnapshotState {
  return state
}

export interface MarketSnapshot {
  /** 已叠加完成的 quotes（TICKER_ITEMS 顺序 + vix 等快照独有品种）；不可用为 null */
  quotes: MarketQuote[] | null
  /** 快照生成时间（ISO 字符串，如 2026-07-20T00:30:00+08:00） */
  asOf: string | null
  /** 行情来源（如 ["iFinD", "Yahoo Finance"]） */
  sources: string[]
}

/** 行情快照 hook：{ quotes, asOf, sources }；quotes=null 时各组件回退演示数据 */
export function useMarketSnapshot(): MarketSnapshot {
  const s = useSyncExternalStore(subscribe, getState)
  return { quotes: s.quotes, asOf: s.asOf, sources: s.sources }
}

/** 按 id 取单个已叠加 quote（快照不可用或无此 id 时返回 undefined） */
export function getQuoteById(quotes: MarketQuote[] | null, id: string): MarketQuote | undefined {
  return quotes?.find((q) => q.id === id)
}

/** 把快照叠加到任意本地 quote 组（price/changePct/spark/note 用快照值，其余保留本地） */
export function overlayQuotes<T extends MarketQuote>(
  items: T[],
  quotes: MarketQuote[] | null,
): T[] {
  if (!quotes) return items
  return items.map((q) => {
    const s = getQuoteById(quotes, q.id)
    return s
      ? ({
          ...q,
          price: s.price,
          changePct: s.changePct,
          spark: s.spark,
          ...(s.note ? { note: s.note } : {}),
        } as T)
      : q
  })
}

/** 快照时间 → 北京 HH:MM（「快照 14:30」标注用；缺失/解析失败返回 ''） */
export function snapshotClock(asOf: string | null): string {
  if (!asOf) return ''
  const t = Date.parse(asOf)
  return Number.isNaN(t) ? '' : beijingClock(new Date(t), false)
}

/** 快照来源标签：iFinD/Yahoo Finance */
export function snapshotSourcesLabel(sources: string[]): string {
  return sources.join('/')
}
