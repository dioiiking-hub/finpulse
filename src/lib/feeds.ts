import { useSyncExternalStore } from 'react'
import type { FeedState, FeedStatus, NewsItem, Region } from '@/lib/types'
import { MOCK_NEWS, nextStreamItem } from '@/data/mockNews'
import { applyCrossSourceBoost, classifyText, computeHeat } from '@/lib/recommend'

/**
 * 可插拔数据适配层（design.md §4/§7）：
 * - RSS 源经公共 CORS 代理（rss2json → allorigins）拉取解析，单源 8s 超时；
 * - 全部失败 → 降级为内置演示数据流（60s 轮询时持续"生成"新热点）；
 * - useNewsFeed() 暴露 { items, status, lastUpdated, nextRefreshAt, lastNew, refresh }，
 *   单例 store：Navbar / Home / Topics 共享同一份状态与同一只 60s 轮询器。
 */

export const POLL_INTERVAL_MS = 60_000
const FETCH_TIMEOUT_MS = 8_000
const MAX_ITEMS = 64

interface RssSource {
  name: string
  url: string
  region: Region
}

/** 中英文财经 RSS 源清单（12 个信源） */
export const RSS_SOURCES: RssSource[] = [
  { name: '华尔街见闻', url: 'https://dedicated.wallstreetcn.com/rss.xml', region: '中国' },
  { name: 'FT中文网', url: 'https://www.ftchinese.com/rss/news', region: '中国' },
  { name: '联合早报', url: 'https://www.zaobao.com.sg/rss/realtime/china', region: '中国' },
  { name: 'BBC中文·财经', url: 'https://feeds.bbci.co.uk/zhongwen/simp/rss.xml', region: '全球' },
  { name: 'Reuters', url: 'https://feeds.reuters.com/reuters/businessNews', region: '美国' },
  { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', region: '美国' },
  { name: 'CNBC Finance', url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', region: '美国' },
  { name: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', region: '美国' },
  { name: 'MarketWatch Pulse', url: 'https://feeds.content.dowjones.io/public/rss/mw_marketpulse', region: '美国' },
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex', region: '美国' },
  { name: 'FT Markets', url: 'https://www.ft.com/markets?format=rss', region: '全球' },
  { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', region: '全球' },
]

/* ---------------- fetch helpers ---------------- */

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res
  } finally {
    clearTimeout(timer)
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

interface RawEntry {
  title: string
  link: string
  summary: string
  publishedAt: number
}

/** 路径一：rss2json（直接返回解析好的 JSON） */
async function viaRss2json(src: RssSource): Promise<RawEntry[]> {
  const res = await fetchWithTimeout(
    `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(src.url)}`,
  )
  const data = (await res.json()) as {
    status?: string
    items?: { title?: string; link?: string; pubDate?: string; description?: string; content?: string }[]
  }
  if (data.status !== 'ok' || !data.items?.length) throw new Error('rss2json: empty')
  return data.items.slice(0, 10).map((it) => ({
    title: (it.title ?? '').trim(),
    link: it.link ?? '#',
    summary: stripHtml(it.description ?? it.content ?? '').slice(0, 180),
    publishedAt: it.pubDate ? Date.parse(it.pubDate.replace(' ', 'T') + 'Z') || Date.now() : Date.now(),
  })).filter((e) => e.title)
}

/** 路径二：allorigins raw + DOMParser 解析 XML */
async function viaAllOrigins(src: RssSource): Promise<RawEntry[]> {
  const res = await fetchWithTimeout(
    `https://api.allorigins.win/raw?url=${encodeURIComponent(src.url)}`,
  )
  const text = await res.text()
  const doc = new DOMParser().parseFromString(text, 'text/xml')
  const nodes = Array.from(doc.querySelectorAll('item, entry')).slice(0, 10)
  if (!nodes.length) throw new Error('allorigins: no items')
  const pick = (el: Element, sels: string[]) => {
    for (const s of sels) {
      const found = el.querySelector(s)
      if (found?.textContent) return found.textContent.trim()
    }
    return ''
  }
  return nodes.map((el) => {
    const linkEl = el.querySelector('link')
    const link = linkEl?.getAttribute('href') ?? linkEl?.textContent?.trim() ?? '#'
    const dateStr = pick(el, ['pubDate', 'published', 'updated', 'dc\\:date'])
    return {
      title: pick(el, ['title']),
      link,
      summary: stripHtml(pick(el, ['description', 'summary', 'content'])).slice(0, 180),
      publishedAt: dateStr ? Date.parse(dateStr) || Date.now() : Date.now(),
    }
  }).filter((e) => e.title)
}

function detectRegion(text: string, fallback: Region): Region {
  if (/中国|央行|人民币|A股|沪指|港股|恒生|证监会|国务院|发改委|北向|南向/.test(text)) return '中国'
  if (/美国|美联储|美元|纳斯达克|标普|华尔道夫|白宫|U\.S\.|Fed\b/i.test(text)) return '美国'
  return fallback
}

let liveSeq = 0
function entryToNewsItem(src: RssSource, e: RawEntry): NewsItem {
  const { category, hits } = classifyText(e.title, e.summary)
  const region = detectRegion(`${e.title} ${e.summary}`, src.region)
  const base: Omit<NewsItem, 'heat'> = {
    id: `live-${Date.now()}-${liveSeq++}`,
    title: e.title,
    summary: e.summary || e.title,
    source: src.name,
    category,
    region,
    publishedAt: e.publishedAt,
    url: e.link || '#',
    keywords: hits.slice(0, 3),
  }
  return { ...base, heat: computeHeat(base) }
}

/** 拉取全部 RSS 源；全部失败时抛错（由调用方降级） */
export async function fetchLiveNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      try {
        return await viaRss2json(src)
      } catch {
        return await viaAllOrigins(src)
      }
    }),
  )
  const items: NewsItem[] = []
  const seen = new Set<string>()
  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') return
    for (const e of r.value) {
      const key = e.title.slice(0, 24)
      if (seen.has(key)) continue
      seen.add(key)
      items.push(entryToNewsItem(RSS_SOURCES[i], e))
    }
  })
  if (items.length < 3) throw new Error('all feeds failed')
  return applyCrossSourceBoost(items)
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, MAX_ITEMS)
}

/* ---------------- 单例 store（60s 轮询） ---------------- */

let state: FeedState = {
  items: MOCK_NEWS,
  status: 'loading' as FeedStatus,
  lastUpdated: Date.now(),
  nextRefreshAt: Date.now() + POLL_INTERVAL_MS,
  lastNew: [],
}

const listeners = new Set<() => void>()
let pollTimer: ReturnType<typeof setInterval> | null = null
let refreshing = false

function emit() {
  listeners.forEach((l) => l())
}

function setState(patch: Partial<FeedState>) {
  state = { ...state, ...patch }
  emit()
}

/** 立即刷新（手动点击倒计时环也会调用） */
export async function refreshFeeds(): Promise<void> {
  if (refreshing) return
  refreshing = true
  setState({ nextRefreshAt: Date.now() + POLL_INTERVAL_MS })
  try {
    const live = await fetchLiveNews()
    const known = new Set(state.items.map((i) => i.id))
    const fresh = live.filter((i) => !known.has(i.id) && !state.items.some((o) => o.title === i.title))
    setState({
      items: live,
      status: 'live',
      lastUpdated: Date.now(),
      lastNew: fresh.slice(0, 3),
    })
  } catch {
    // 降级：演示数据流，注入 1 条新热点保持"活"感
    const injected = nextStreamItem()
    const merged = [injected, ...state.items.filter((i) => i.title !== injected.title)].slice(0, MAX_ITEMS)
    setState({
      items: applyCrossSourceBoost(merged),
      status: 'demo',
      lastUpdated: Date.now(),
      lastNew: [injected],
    })
  } finally {
    refreshing = false
  }
}

function start() {
  if (pollTimer) return
  void refreshFeeds()
  pollTimer = setInterval(() => void refreshFeeds(), POLL_INTERVAL_MS)
}

function stop() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
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

function getSnapshot(): FeedState {
  return state
}

export interface UseNewsFeedResult extends FeedState {
  refresh: () => void
}

/** 60s 轮询 hook：{ items, status: 'live'|'demo'|'loading', lastUpdated, nextRefreshAt, lastNew, refresh() } */
export function useNewsFeed(): UseNewsFeedResult {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return { ...snapshot, refresh: () => void refreshFeeds() }
}
