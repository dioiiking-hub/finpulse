import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Archive, CalendarDays, Download, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ArchiveTopic, DayArchive } from '@/lib/topicArchive'
import { useTopicArchive } from '@/lib/topicArchive'
import CategoryTag from '@/components/CategoryTag'
import PlatformBadge from '@/components/PlatformBadge'
import EmptyState from '@/components/EmptyState'
import { toast } from '@/components/Toast'
import { enrichArchiveTopic } from '@/pages/topics/model'
import TopicDrawer from '@/pages/topics/TopicDrawer'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]
/** 跨天查重 / 下载默认覆盖的天数 */
const RANGE_DAYS = 7

/* ---------------- 小部件 ---------------- */

const GRADE_STYLE: Record<string, string> = {
  S: 'border-gold/60 bg-gold/10 text-gold',
  A: 'border-us-blue/60 bg-us-blue/10 text-us-blue',
  B: 'border-line bg-surface-2 text-text-2',
}

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-bold',
        GRADE_STYLE[grade] ?? GRADE_STYLE.B,
      )}
    >
      {grade}
    </span>
  )
}

/** ISO 时间 → 北京 MM-DD HH:MM */
function bjShort(iso: string): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(t))
}

/** 选题行 */
function TopicRow({
  topic,
  dupDates,
  index,
  onOpen,
}: {
  topic: ArchiveTopic
  /** 近 7 天内出现过同题材（分类+关键词）的其他日期 */
  dupDates: string[]
  index: number
  /** 点击整卡打开详情抽屉（角度 / 备选标题 / 对谈提纲） */
  onOpen?: (t: ArchiveTopic) => void
}) {
  const [expand, setExpand] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.35, ease: EASE }}
      onClick={() => onOpen?.(topic)}
      className="cursor-pointer rounded-xl border border-line bg-surface-1 p-4 transition-[border-color,box-shadow] duration-200 hover:border-gold/40 hover:shadow-lift md:p-5"
    >
      <div className="flex items-start gap-3.5">
        <GradeBadge grade={topic.grade} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 className="text-[15px] font-semibold leading-6 text-text-1">{topic.title}</h3>
            {dupDates.length > 0 && (
              <span
                title={`同题材「${topic.keyword}」已出现于：${dupDates.join('、')}`}
                className="inline-flex h-6 items-center gap-1 rounded-full border border-gold/40 bg-gold/5 px-2 text-[11px] text-gold"
              >
                <Repeat size={11} />
                同题材 {dupDates.map((d) => d.slice(5)).join('/')}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CategoryTag category={topic.category} short />
            {topic.platforms.map((p, i) => (
              <PlatformBadge key={p} platform={p} primary={i === 0} />
            ))}
            <span className="font-mono text-xs text-text-3">
              综合 <span className="tnum text-text-1">{topic.score}</span> · 热度{' '}
              <span className="tnum text-text-1">{topic.heat}</span> · 关键词 {topic.keyword}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setExpand((v) => !v)
            }}
            className="mt-2 block w-full text-left"
          >
            <p
              className={cn(
                'text-[13px] leading-6 text-text-2',
                expand ? '' : 'line-clamp-2',
              )}
            >
              {topic.reason}
            </p>
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-text-3">
            <span className="truncate">
              关联热点：
              {topic.newsUrl ? (
                <a
                  href={topic.newsUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-text-2 underline decoration-line underline-offset-2 transition-colors hover:text-gold"
                >
                  {topic.newsTitle}
                </a>
              ) : (
                topic.newsTitle
              )}
            </span>
            <span className="shrink-0">
              {topic.source} · 首现 {bjShort(topic.firstSeenAt)}
              {topic.lastSeenAt !== topic.firstSeenAt && ` · 末现 ${bjShort(topic.lastSeenAt)}`}
            </span>
            <span className="shrink-0 cursor-pointer text-gold/70 transition-colors hover:text-gold">
              详情 ›
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ---------------- CSV 导出 ---------------- */

function csvEscape(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function buildCsv(days: DayArchive[]): string {
  const header = ['日期', '级别', '选题标题', '分类', '地区', '适配平台', '综合分', '热度', '关键词', '推荐理由', '关联热点', '原文链接', '信源', '首次出现(北京)', '最近出现(北京)']
  const rows = days.flatMap((d) =>
    d.topics.map((t) =>
      [
        d.date,
        t.grade,
        t.title,
        t.category,
        t.region,
        t.platforms.join('/'),
        t.score,
        t.heat,
        t.keyword,
        t.reason,
        t.newsTitle,
        t.newsUrl,
        t.source,
        bjShort(t.firstSeenAt),
        bjShort(t.lastSeenAt),
      ]
        .map(csvEscape)
        .join(','),
    ),
  )
  // BOM 保证 Excel 打开中文不乱码
  return '\uFEFF' + [header.join(','), ...rows].join('\n')
}

function downloadCsv(days: DayArchive[], filename: string) {
  const blob = new Blob([buildCsv(days)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* ---------------- 页面 ---------------- */

/**
 * 选题归档 `/archive`：
 * 按天查看历史选题推荐（GitHub Actions 每日 4 时点归档），
 * 支持近 7 天跨天同题材查重标注与 CSV 下载（当日 / 近 7 天）。
 */
export default function ArchivePage() {
  const { dates, failed, days, loadDay } = useTopicArchive()
  const [selected, setSelected] = useState<string | null>(null)
  /** 详情抽屉当前选中的归档选题（角度 / 备选标题 / 对谈提纲） */
  const [openTopic, setOpenTopic] = useState<ArchiveTopic | null>(null)
  // 默认选中最新一天（派生值，避免在 effect 中 setState）
  const current = selected ?? dates?.[0] ?? null

  // 索引到达后预加载近 7 天（跨天查重与下载用）
  useEffect(() => {
    if (!dates?.length) return
    dates.slice(0, RANGE_DAYS).forEach((d) => void loadDay(d))
  }, [dates, loadDay])

  const rangeDates = useMemo(() => (dates ?? []).slice(0, RANGE_DAYS), [dates])
  const day = current ? days[current] : undefined

  // 跨天查重：分类+关键词 → 出现日期集合
  const dupMap = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const d of rangeDates) {
      const archive = days[d]
      if (!archive) continue
      for (const t of archive.topics) {
        const key = `${t.category}::${t.keyword}`
        const list = m.get(key) ?? []
        list.push(d)
        m.set(key, list)
      }
    }
    return m
  }, [days, rangeDates])

  const dupCountForDay = useMemo(() => {
    if (!day || !current) return 0
    return day.topics.filter(
      (t) => (dupMap.get(`${t.category}::${t.keyword}`) ?? []).some((d) => d !== current),
    ).length
  }, [day, current, dupMap])

  const loadedRangeDays = useMemo(
    () => rangeDates.map((d) => days[d]).filter((v): v is DayArchive => Boolean(v)),
    [days, rangeDates],
  )

  const onDownloadDay = () => {
    if (!day || !current) return
    downloadCsv([day], `finpulse-选题归档-${current}.csv`)
    toast(`已导出 ${current} 共 ${day.topics.length} 条选题`)
  }

  const onDownloadRange = () => {
    if (!loadedRangeDays.length) return
    downloadCsv(loadedRangeDays, `finpulse-选题归档-近${loadedRangeDays.length}天.csv`)
    toast(`已导出近 ${loadedRangeDays.length} 天选题`)
  }

  return (
    <>
      {/* 页头 */}
      <section className="bg-bg-0 pb-8 pt-16">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-x-10 gap-y-8 px-4 md:px-8">
          <div>
            <motion.p
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold"
            >
              <span className="inline-block h-3 w-0.5 bg-gold" />
              TOPIC ARCHIVE
              <span className="font-sans normal-case tracking-[0.08em]">· 选题归档</span>
            </motion.p>
            <h1 className="mt-3 text-[30px] font-black leading-[38px] text-text-1 md:text-[40px] md:leading-[48px]">
              历史选题归档
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
              className="mt-3 max-w-[560px] text-[15px] leading-7 text-text-2"
            >
              每日 4 个时点（09:30 / 13:00 / 18:00 / 23:30）由同一套推荐引擎基于当日热点自动归档，
              与线上实时推荐口径一致。近 7 天内同题材（分类+关键词）重复出现的选题会被标注，
              便于检查每日推荐的重复度。
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
            className="flex gap-6 md:gap-8"
          >
            <div>
              <p className="tnum font-mono text-[28px] font-bold leading-none text-text-1">
                {dates?.length ?? '–'}
              </p>
              <p className="mt-2 text-[11px] tracking-[0.08em] text-text-3">归档天数</p>
            </div>
            <div>
              <p className="tnum font-mono text-[28px] font-bold leading-none text-text-1">
                {day ? day.topics.length : '–'}
              </p>
              <p className="mt-2 text-[11px] tracking-[0.08em] text-text-3">当日选题</p>
            </div>
            <div>
              <p className="tnum font-mono text-[28px] font-bold leading-none text-text-1">
                {day ? dupCountForDay : '–'}
              </p>
              <p className="mt-2 text-[11px] tracking-[0.08em] text-text-3">近7天同题材重复</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 工具栏：日期选择 + 下载 */}
      <section className="sticky top-16 z-40 border-y border-line bg-bg-0/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
            <CalendarDays size={15} className="shrink-0 text-text-3" />
            {(dates ?? []).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelected(d)}
                className={cn(
                  'h-8 shrink-0 rounded-lg border px-3 font-mono text-xs transition-colors',
                  current === d
                    ? 'border-gold/60 bg-gold/10 text-gold'
                    : 'border-line text-text-2 hover:border-text-3 hover:text-text-1',
                )}
              >
                {d.slice(5)}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onDownloadDay}
              disabled={!day}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs text-text-1 transition-colors hover:border-gold/60 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={13} />
              下载当日 CSV
            </button>
            <button
              type="button"
              onClick={onDownloadRange}
              disabled={!loadedRangeDays.length}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs text-text-1 transition-colors hover:border-gold/60 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={13} />
              下载近{loadedRangeDays.length || RANGE_DAYS}天 CSV
            </button>
          </div>
        </div>
      </section>

      {/* 选题列表 */}
      <section className="bg-bg-0 py-10">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8">
          {failed ? (
            <div className="rounded-xl border border-line bg-surface-1">
              <EmptyState
                title="选题归档尚未生成"
                hint="归档由 GitHub Actions 每日 4 个时点自动生成（需先推送 topics-archive workflow），首次生成后即可在此查看"
              />
            </div>
          ) : day ? (
            <>
              <div className="mb-4 flex items-center gap-2 font-mono text-xs text-text-3">
                <Archive size={13} />
                {day.date} · 快照时点 {day.snapshots.join(' / ') || '–'} · 共 {day.topics.length} 条
              </div>
              <div className="grid gap-4">
                {day.topics.map((t, i) => (
                  <TopicRow
                    key={t.id}
                    topic={t}
                    index={i}
                    onOpen={setOpenTopic}
                    dupDates={(dupMap.get(`${t.category}::${t.keyword}`) ?? []).filter(
                      (d) => d !== current,
                    )}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-line bg-surface-1">
              <EmptyState title="归档加载中…" hint="正在从远程仓库拉取当日选题归档" />
            </div>
          )}
        </div>
      </section>

      {/* 选题详情抽屉：角度 / 备选标题 / 对谈提纲（复用推荐页抽屉，只读模式） */}
      <TopicDrawer
        topic={openTopic ? enrichArchiveTopic(openTopic) : null}
        inLibrary={false}
        onToggleLibrary={() => {}}
        onClose={() => setOpenTopic(null)}
        onLocate={() => {}}
        readOnly
      />
    </>
  )
}
