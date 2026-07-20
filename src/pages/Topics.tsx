import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import type { Category } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'
import { useNewsFeed } from '@/lib/feeds'
import EmptyState from '@/components/EmptyState'
import { toast } from '@/components/Toast'
import { buildTopics, enrichFromNewsItem } from './topics/model'
import type { RichTopic } from './topics/model'
import TopicCard from './topics/TopicCard'
import TopicDrawer from './topics/TopicDrawer'
import FilterBar from './topics/FilterBar'
import type { PlatformFilter, SortMode } from './topics/FilterBar'
import EngineSection from './topics/EngineSection'
import TeamBoard, { TEAM_COUNT } from './topics/TeamBoard'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

/** 页头统计数字（count-up 1s，支持 delay） */
function StatNumber({ value, delay }: { value: number; delay: number }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => String(Math.round(v)))
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1, delay, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [value, delay, mv])
  return <motion.span>{text}</motion.span>
}

/**
 * 选题推荐 `/topics`（topics.md）：
 * S1 页头统计 / S2 筛选工具栏 / S3 推荐卡网格 / S4 详情抽屉 / S5 引擎说明 / S6 团队选题库。
 * 支持 `?focus=<热点id>` 自动打开抽屉、`?category=<分类>` 预选分类筛选。
 */
export default function Topics() {
  const { items } = useNewsFeed()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const topics = useMemo(() => buildTopics(items), [items])

  /* ---------------- 筛选状态 ---------------- */
  const [platform, setPlatform] = useState<PlatformFilter>('全部')
  const [cats, setCats] = useState<Set<Category>>(() => {
    const raw = searchParams.get('category')
    if (!raw) return new Set<Category>()
    return new Set(
      raw.split(',').filter((c): c is Category => (CATEGORIES as string[]).includes(c)),
    )
  })
  const [minHeat, setMinHeat] = useState(40)
  const [sort, setSort] = useState<SortMode>('综合推荐')
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement | null>(null)

  /* ---------------- 收藏 / 选题库 / 抽屉 ---------------- */
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [libraryIds, setLibraryIds] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // 打开的抽屉（派生）：优先 ?focus=<热点id>（首页「生成选题」跳入），其次卡片选中
  const openTopic = useMemo<RichTopic | null>(() => {
    const focus = searchParams.get('focus')
    if (focus) {
      const hit = topics.find((t) => t.id === focus || t.newsId === focus)
      if (hit) return hit
      const news = items.find((i) => i.id === focus)
      if (news) return enrichFromNewsItem(news, items)
    }
    if (selectedId) return topics.find((t) => t.id === selectedId) ?? null
    return null
  }, [searchParams, selectedId, topics, items])

  // ⌘K / Ctrl+K 聚焦搜索
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const closeDrawer = () => {
    setSelectedId(null)
    if (searchParams.get('focus')) {
      const next = new URLSearchParams(searchParams)
      next.delete('focus')
      setSearchParams(next, { replace: true })
    }
  }

  /* ---------------- 派生数据 ---------------- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = topics.filter(
      (t) =>
        (platform === '全部' || t.platforms.includes(platform)) &&
        (cats.size === 0 || cats.has(t.category)) &&
        t.heat >= minHeat &&
        (!q ||
          t.title.toLowerCase().includes(q) ||
          t.reason.toLowerCase().includes(q) ||
          t.angle.toLowerCase().includes(q)),
    )
    if (sort === '热度优先') list.sort((a, b) => b.heat - a.heat)
    else if (sort === '时效优先') list.sort((a, b) => b.publishedAt - a.publishedAt)
    else list.sort((a, b) => b.score - a.score)
    return list
  }, [topics, platform, cats, minHeat, sort, query])

  const stats = useMemo(() => {
    const total = topics.length
    const avg = total ? Math.round(topics.reduce((acc, t) => acc + t.heat, 0) / total) : 0
    const hot = total ? Math.round((topics.filter((t) => t.heat >= 80).length / total) * 100) : 0
    return [
      { label: '今日推荐', value: total, suffix: ' 条' },
      { label: '平均热度', value: avg, suffix: '' },
      { label: '高热占比', value: hot, suffix: '%' },
      { label: '已认领', value: TEAM_COUNT + libraryIds.size, suffix: '' },
    ]
  }, [topics, libraryIds])

  /* ---------------- 操作 ---------------- */
  const toggleCat = (c: Category) =>
    setCats((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })

  const toggleSave = (t: RichTopic) =>
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(t.id)) {
        next.delete(t.id)
        toast('已取消收藏')
      } else {
        next.add(t.id)
        toast('已收藏选题')
      }
      return next
    })

  const toggleLibrary = (t: RichTopic) =>
    setLibraryIds((prev) => {
      const next = new Set(prev)
      if (next.has(t.id)) {
        next.delete(t.id)
        toast('已移出选题库')
      } else {
        next.add(t.id)
        toast('已加入选题库')
      }
      return next
    })

  const locateNews = (newsId: string | null) => {
    navigate(newsId ? `/?focus=${newsId}` : '/')
  }

  const resetFilters = () => {
    setPlatform('全部')
    setCats(new Set())
    setMinHeat(40)
    setQuery('')
  }

  return (
    <>
      {/* S1 · 页头 */}
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
              TOPIC ENGINE
              <span className="font-sans normal-case tracking-[0.08em]">· 选题引擎</span>
            </motion.p>
            <h1 className="mt-3 text-[30px] font-black leading-[38px] text-text-1 md:text-[40px] md:leading-[48px]">
              {['今日', '选题', '推荐'].map((w, i) => (
                <span key={w} className="inline-block overflow-hidden align-bottom">
                  <motion.span
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: EASE }}
                    className="inline-block"
                  >
                    {w}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
              className="mt-3 max-w-[560px] text-[15px] leading-7 text-text-2"
            >
              基于实时热点的热度评分与平台适配，为团队自动生成可执行的选题。每一条推荐都附理由
              —— 为什么值得做、适合哪个平台、从哪个角度切入。
            </motion.p>
          </div>

          {/* 右侧统计 chips */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
            className="flex gap-6 md:gap-8"
          >
            {stats.map((s, i) => (
              <div key={s.label}>
                <p className="tnum font-mono text-[28px] font-bold leading-none text-text-1">
                  <StatNumber value={s.value} delay={0.4 + i * 0.1} />
                  {s.suffix && <span className="ml-0.5 text-sm font-normal text-text-3">{s.suffix}</span>}
                </p>
                <p className="mt-2 text-[11px] tracking-[0.08em] text-text-3">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* S2 · 筛选工具栏 */}
      <FilterBar
        platform={platform}
        onPlatform={setPlatform}
        cats={cats}
        onToggleCat={toggleCat}
        minHeat={minHeat}
        onMinHeat={setMinHeat}
        sort={sort}
        onSort={setSort}
        query={query}
        onQuery={setQuery}
        matchCount={filtered.length}
        searchRef={searchRef}
      />

      {/* S3 · 推荐卡网格 */}
      <section className="bg-bg-0 py-10">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8">
          {filtered.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filtered.map((t, i) => (
                  <TopicCard
                    key={t.id}
                    topic={t}
                    index={i}
                    saved={savedIds.has(t.id)}
                    inLibrary={libraryIds.has(t.id)}
                    onToggleSave={toggleSave}
                    onToggleLibrary={toggleLibrary}
                    onOpen={(t) => setSelectedId(t.id)}
                    onLocate={locateNews}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-surface-1">
              <EmptyState
                title="没有匹配当前条件的选题"
                hint="试试降低热度阈值、减少分类或清除搜索词"
                action={
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-4 text-sm text-text-1 transition-colors hover:border-gold/60 hover:text-gold"
                  >
                    <RotateCcw size={14} />
                    清除筛选
                  </button>
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* S5 · 评分引擎说明 */}
      <EngineSection />

      {/* S6 · 团队选题库 */}
      <TeamBoard />

      {/* S4 · 选题详情抽屉 */}
      <TopicDrawer
        topic={openTopic}
        inLibrary={openTopic ? libraryIds.has(openTopic.id) : false}
        onToggleLibrary={toggleLibrary}
        onClose={closeDrawer}
        onLocate={(id) => {
          closeDrawer()
          locateNews(id)
        }}
      />
    </>
  )
}
