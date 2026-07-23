/**
 * 选题归档生成脚本（GitHub Actions 每日多时点运行，也可本地手动执行）。
 *
 * 链路：服务端直连 RSS 源（Node 环境无浏览器 CORS 限制，比前端降级链更稳）
 *   → 复用 src/lib/recommend.ts 同一套规则引擎（分类 / 热度 / 跨源共振 / 选题生成），
 *     保证归档口径与线上实时推荐完全一致
 *   → 合并写入 public/data/topics-archive/YYYY-MM-DD.json（按北京时间划天，
 *     同一天多次运行按「分类 + 关键词」去重合并，保留最高热度与首末次出现时间）
 *   → 重建 index.json（日期清单，供前端归档页拉取）。
 *
 * 用法：npx tsx scripts/make_topics_archive.ts [输出目录，默认 public/data/topics-archive]
 * 容错：抓取到的快讯不足 3 条时视为整体失败，退出码 1（workflow 中不提交）。
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Category, NewsItem, Platform, Region } from '../src/lib/types'
import { applyCrossSourceBoost, classifyText, computeHeat, generateTopics } from '../src/lib/recommend'

/* ---------------- 信源清单（与 src/lib/feeds.ts 保持同步） ---------------- */

interface HubSource {
  name: string
  url: string
  region: Region
}

const RSSHUB_INSTANCES = ['https://rsshub.rssforever.com', 'https://rsshub.ktachibana.party'] as const

/** RSSHub 高优先级源（顺序即优先级） */
const RSSHUB_SOURCES: { name: string; path: string; region: Region }[] = [
  { name: '财联社电报', path: '/cls/telegraph', region: '中国' },
  { name: '华尔街见闻快讯', path: '/wallstreetcn/live', region: '中国' },
  { name: '华尔街见闻新闻', path: '/wallstreetcn/news', region: '中国' },
  { name: '见闻最热', path: '/wallstreetcn/hot', region: '中国' },
  { name: '新浪滚动财经', path: '/sina/rollnews/2516', region: '中国' },
  { name: '新浪美股', path: '/sina/rollnews/2518', region: '美国' },
  { name: '金十数据', path: '/jin10', region: '全球' },
  { name: 'CNBC', path: '/cnbc/rss', region: '美国' },
]

/** 直连 RSS 源（服务端无需 CORS 代理） */
const RSS_SOURCES: HubSource[] = [
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

const FETCH_TIMEOUT_MS = 10_000
const MAX_ITEMS = 64
const TOPICS_PER_RUN = 24

/* ---------------- 抓取与解析 ---------------- */

interface RawEntry {
  title: string
  link: string
  summary: string
  publishedAt: number
}

async function fetchText(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<string> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'user-agent': 'finpulse-archive-bot/1.0' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripHtml(html: string): string {
  return decodeEntities(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function pickTag(block: string, tags: string[]): string {
  for (const tag of tags) {
    const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'))
    if (m?.[1]) return decodeEntities(m[1]).trim()
  }
  return ''
}

/** RSS/Atom XML → RawEntry（无 DOM 依赖的正则解析，服务端专用） */
function parseXmlEntries(xml: string): RawEntry[] {
  const blocks = [
    ...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi),
    ...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi),
  ].slice(0, 12)
  if (!blocks.length) throw new Error('xml: no items')
  return blocks
    .map((m) => {
      const b = m[1]
      const linkMatch =
        b.match(/<link\s[^>]*href="([^"]+)"/i) ?? b.match(/<link(?:\s[^>]*)?>([\s\S]*?)<\/link>/i)
      const dateStr = pickTag(b, ['pubDate', 'published', 'updated', 'dc:date'])
      return {
        title: stripHtml(pickTag(b, ['title'])),
        link: linkMatch?.[1] ? decodeEntities(linkMatch[1]).trim() : '#',
        summary: stripHtml(pickTag(b, ['description', 'summary', 'content', 'content:encoded'])).slice(0, 180),
        publishedAt: dateStr ? Date.parse(dateStr) || Date.now() : Date.now(),
      }
    })
    .filter((e) => e.title)
}

async function viaRsshub(src: (typeof RSSHUB_SOURCES)[number]): Promise<RawEntry[]> {
  let lastErr: unknown = new Error('rsshub: no attempts')
  for (const inst of RSSHUB_INSTANCES) {
    try {
      return parseXmlEntries(await fetchText(`${inst}${src.path}`))
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('rsshub: failed')
}

/* ---------------- 快讯 → NewsItem（逻辑同 feeds.ts，复用推荐引擎） ---------------- */

function detectRegion(text: string, fallback: Region): Region {
  if (/中国|央行|人民币|A股|沪指|港股|恒生|证监会|国务院|发改委|北向|南向/.test(text)) return '中国'
  if (/美国|美联储|美元|纳斯达克|标普|白宫|U\.S\.|Fed\b/i.test(text)) return '美国'
  return fallback
}

let seq = 0
function entryToNewsItem(src: { name: string; region: Region }, e: RawEntry, runTs: number): NewsItem {
  const { category, hits } = classifyText(e.title, e.summary)
  const region = detectRegion(`${e.title} ${e.summary}`, src.region)
  const base: Omit<NewsItem, 'heat'> = {
    id: `arch-${runTs}-${seq++}`,
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

async function fetchAllFeeds(runTs: number): Promise<NewsItem[]> {
  const [hubResults, directResults] = await Promise.all([
    Promise.allSettled(RSSHUB_SOURCES.map((s) => viaRsshub(s))),
    Promise.allSettled(RSS_SOURCES.map(async (s) => parseXmlEntries(await fetchText(s.url)))),
  ])
  const items: NewsItem[] = []
  const seen = new Set<string>()
  const collect = (
    results: PromiseSettledResult<RawEntry[]>[],
    sources: readonly { name: string; region: Region }[],
  ) => {
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        for (const e of r.value) {
          const key = e.title.slice(0, 24)
          if (seen.has(key)) continue
          seen.add(key)
          items.push(entryToNewsItem(sources[i], e, runTs))
        }
      } else {
        console.warn(`[warn] 信源失败：${sources[i].name}（${(r.reason as Error).message}）`)
      }
    })
  }
  collect(hubResults, RSSHUB_SOURCES)
  collect(directResults, RSS_SOURCES)
  if (items.length < 3) throw new Error('all feeds failed')
  return applyCrossSourceBoost(items)
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, MAX_ITEMS)
}

/* ---------------- 归档数据结构 ---------------- */

type Grade = 'S' | 'A' | 'B'

interface ArchiveTopic {
  id: string
  title: string
  reason: string
  category: Category
  region: Region
  platforms: Platform[]
  grade: Grade
  score: number
  heat: number
  angle: string
  /** 题材关键词（跨天查重的主键之一） */
  keyword: string
  /** 关联热点原文 */
  newsTitle: string
  newsUrl: string
  source: string
  publishedAt: number
  firstSeenAt: string
  lastSeenAt: string
}

interface DayArchive {
  date: string
  generatedAt: string
  /** 当日已合并的快照时点（北京时间 HH:MM） */
  snapshots: string[]
  topics: ArchiveTopic[]
}

interface IndexJson {
  updatedAt: string
  dates: string[]
}

function gradeOf(heat: number): Grade {
  if (heat >= 82) return 'S'
  if (heat >= 68) return 'A'
  return 'B'
}

/** 北京时间工具（GitHub runner 为 UTC） */
const BJ_OFFSET_MS = 8 * 3_600_000
function bjDate(now: number): string {
  return new Date(now + BJ_OFFSET_MS).toISOString().slice(0, 10)
}
function bjClock(now: number): string {
  return new Date(now + BJ_OFFSET_MS).toISOString().slice(11, 16)
}

/* ---------------- 主流程 ---------------- */

async function main() {
  const outDir = path.resolve(process.argv[2] ?? 'public/data/topics-archive')
  mkdirSync(outDir, { recursive: true })

  const now = Date.now()
  const date = bjDate(now)
  const clock = bjClock(now)
  const isoNow = new Date(now).toISOString()

  console.log(`[1/3] 抓取 ${RSSHUB_SOURCES.length + RSS_SOURCES.length} 个信源…`)
  const items = await fetchAllFeeds(now)
  console.log(`      获得 ${items.length} 条快讯，生成选题…`)

  const recs = generateTopics(items, TOPICS_PER_RUN)
  if (!recs.length) throw new Error('no topics generated')
  const byId = new Map(items.map((i) => [i.id, i]))

  const fresh: ArchiveTopic[] = recs.map((rec, idx) => {
    const item = byId.get(rec.newsId)
    const keyword = item?.keywords[0] ?? rec.category
    return {
      id: `${date}-${String(idx + 1).padStart(2, '0')}`,
      title: rec.title,
      reason: rec.reason,
      category: rec.category,
      region: rec.region,
      platforms: rec.platforms,
      grade: gradeOf(rec.heat),
      score: rec.score,
      heat: rec.heat,
      angle: rec.angle,
      keyword,
      newsTitle: item?.title ?? rec.title,
      newsUrl: item?.url && item.url.startsWith('http') ? item.url : '',
      source: rec.source,
      publishedAt: rec.publishedAt,
      firstSeenAt: isoNow,
      lastSeenAt: isoNow,
    }
  })

  // 与当日已有归档合并：分类 + 关键词 为主键去重，保留更高热度/综合分的版本
  const dayFile = path.join(outDir, `${date}.json`)
  let existing: DayArchive | null = null
  try {
    existing = JSON.parse(readFileSync(dayFile, 'utf8')) as DayArchive
  } catch {
    // 当日首次生成
  }

  const merged = new Map<string, ArchiveTopic>()
  for (const t of existing?.topics ?? []) merged.set(`${t.category}::${t.keyword}`, t)
  for (const t of fresh) {
    const key = `${t.category}::${t.keyword}`
    const prev = merged.get(key)
    if (!prev) {
      merged.set(key, t)
    } else {
      const winner = t.score > prev.score ? t : prev
      merged.set(key, {
        ...winner,
        heat: Math.max(prev.heat, t.heat),
        score: Math.max(prev.score, t.score),
        firstSeenAt: prev.firstSeenAt,
        lastSeenAt: isoNow,
      })
    }
  }

  const topics = [...merged.values()].sort((a, b) => b.score - a.score)
  // 重新编号保证 id 稳定可读
  topics.forEach((t, i) => (t.id = `${date}-${String(i + 1).padStart(2, '0')}`))

  const archive: DayArchive = {
    date,
    generatedAt: isoNow,
    snapshots: [...new Set([...(existing?.snapshots ?? []), clock])].sort(),
    topics,
  }
  writeFileSync(dayFile, JSON.stringify(archive, null, 2))

  // 重建 index.json（扫描目录，日期倒序）
  const dates = readdirSync(outDir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.slice(0, 10))
    .sort()
    .reverse()
  const index: IndexJson = { updatedAt: isoNow, dates }
  writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2))

  console.log(`[2/3] 已写入 ${dayFile}（${topics.length} 条选题，当日快照时点：${archive.snapshots.join('/')}）`)
  console.log(`[3/3] index.json 共 ${dates.length} 天归档`)
}

main().catch((e) => {
  console.error(`[fail] ${(e as Error).message}`)
  process.exit(1)
})
