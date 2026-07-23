import { useCallback, useEffect, useRef, useState } from 'react'
import type { Category, Platform, Region } from '@/lib/types'
import { REMOTE_SNAPSHOT_REPO } from '@/lib/marketSnapshot'

/**
 * 选题归档数据层（topics-archive 流，复用行情快照的远程拉取模式）：
 * - GitHub Actions 每日 4 个时点运行 scripts/make_topics_archive.ts，
 *   产出 public/data/topics-archive/index.json 与 YYYY-MM-DD.json 并提交回仓库；
 * - 拉取顺序：raw.githubusercontent（主）→ jsDelivr CDN（备）→ 站点内置 /data/（兜底）；
 * - useTopicArchive()：加载日期索引 + 按天懒加载归档（带缓存），
 *   归档尚不存在（workflow 未产出过）时 dates 为 null、failed 为 true，页面展示空态。
 */

export type ArchiveGrade = 'S' | 'A' | 'B'

export interface ArchiveTopic {
  id: string
  title: string
  reason: string
  category: Category
  region: Region
  platforms: Platform[]
  grade: ArchiveGrade
  score: number
  heat: number
  angle: string
  keyword: string
  newsTitle: string
  newsUrl: string
  source: string
  publishedAt: number
  firstSeenAt: string
  lastSeenAt: string
}

export interface DayArchive {
  date: string
  generatedAt: string
  snapshots: string[]
  topics: ArchiveTopic[]
}

interface ArchiveIndex {
  updatedAt?: string
  dates?: string[]
}

const FETCH_TIMEOUT_MS = 5_000

const REMOTE_BASES: string[] = REMOTE_SNAPSHOT_REPO.includes('YOUR_GITHUB_USER')
  ? []
  : (() => {
      const [repo, branch = 'main'] = REMOTE_SNAPSHOT_REPO.split('@')
      return [
        `https://raw.githubusercontent.com/${repo}/${branch}/public/data/topics-archive`,
        `https://cdn.jsdelivr.net/gh/${repo}@${branch}/public/data/topics-archive`,
      ]
    })()

async function fetchJson<T>(url: string): Promise<T> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(t)
  }
}

/** 三级拉取链：raw → jsDelivr → 站点内置 */
async function fetchArchiveJson<T>(file: string): Promise<T> {
  let lastErr: unknown = new Error('no sources')
  for (const base of REMOTE_BASES) {
    try {
      return await fetchJson<T>(`${base}/${file}?t=${Date.now()}`)
    } catch (e) {
      lastErr = e
    }
  }
  try {
    return await fetchJson<T>(`/data/topics-archive/${file}`)
  } catch {
    throw lastErr instanceof Error ? lastErr : new Error('archive fetch failed')
  }
}

export interface UseTopicArchiveResult {
  /** 可用日期（新→旧）；null = 加载中 */
  dates: string[] | null
  /** 索引拉取失败（含归档尚未生成） */
  failed: boolean
  /** 已加载的当日归档（key = 日期） */
  days: Record<string, DayArchive>
  /** 懒加载某一天的归档（带缓存，重复调用不重复请求） */
  loadDay: (date: string) => Promise<DayArchive | null>
}

export function useTopicArchive(): UseTopicArchiveResult {
  const [dates, setDates] = useState<string[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [days, setDays] = useState<Record<string, DayArchive>>({})
  const cacheRef = useRef<Record<string, DayArchive>>({})
  const inflightRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let alive = true
    fetchArchiveJson<ArchiveIndex>('index.json')
      .then((idx) => {
        if (!alive) return
        const list = Array.isArray(idx.dates) ? idx.dates.filter((d) => typeof d === 'string') : []
        setDates(list)
        setFailed(list.length === 0)
      })
      .catch(() => {
        if (!alive) return
        setDates([])
        setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [])

  const loadDay = useCallback(async (date: string): Promise<DayArchive | null> => {
    if (cacheRef.current[date]) return cacheRef.current[date]
    if (inflightRef.current.has(date)) return null
    inflightRef.current.add(date)
    try {
      const day = await fetchArchiveJson<DayArchive>(`${date}.json`)
      if (!day || !Array.isArray(day.topics)) return null
      cacheRef.current[date] = day
      setDays((prev) => ({ ...prev, [date]: day }))
      return day
    } catch {
      return null
    } finally {
      inflightRef.current.delete(date)
    }
  }, [])

  return { dates, failed, days, loadDay }
}
