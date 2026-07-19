import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownUp, Bookmark, RotateCcw, Sparkles } from 'lucide-react'
import type { Category, NewsItem, Region } from '@/lib/types'
import { CATEGORIES, CATEGORY_SHORT, REGIONS } from '@/lib/types'
import { POLL_INTERVAL_MS, useNewsFeed } from '@/lib/feeds'
import { useNow } from '@/lib/useNow'
import { absoluteTime, relativeTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import DataStatusBadge from '@/components/DataStatusBadge'
import SegmentedTabs from '@/components/SegmentedTabs'
import CountdownRing from '@/components/CountdownRing'
import HeatBadge from '@/components/HeatBadge'
import CategoryTag from '@/components/CategoryTag'
import RegionTag from '@/components/RegionTag'
import SourceChip from '@/components/SourceChip'
import EmptyState from '@/components/EmptyState'
import { toast } from '@/components/Toast'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]
const PAGE_SIZE = 12
const LOAD_STEP = 8

type CatFilter = '全部' | Category
type RegionFilter = '全部' | Region
type SortMode = 'heat' | 'time'

function FeedItem({
  item,
  isNew,
  highlighted,
  saved,
  onToggleSave,
  index,
}: {
  item: NewsItem
  isNew: boolean
  highlighted: boolean
  saved: boolean
  onToggleSave: (id: string) => void
  index: number
}) {
  const navigate = useNavigate()
  const now = useNow(30_000)
  return (
    <motion.article
      id={`feed-item-${item.id}`}
      layout="position"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 12) * 0.05, ease: EASE }}
      className={cn(
        'group relative flex gap-4 border-b border-line p-4 transition-colors hover:bg-surface-2',
        highlighted && 'animate-flash-gold bg-gold/5',
      )}
    >
      {/* 新热点 gold 左边框闪烁 */}
      {isNew && (
        <span className="absolute inset-y-0 left-0 w-0.5 animate-flash-gold bg-gold" aria-hidden />
      )}
      <HeatBadge heat={item.heat} className="shrink-0 pt-0.5" />
      <div className="min-w-0 flex-1">
        <a
          href={item.url}
          target={item.url === '#' ? undefined : '_blank'}
          rel="noreferrer"
          onClick={item.url === '#' ? (e) => e.preventDefault() : undefined}
          className="line-clamp-2 cursor-pointer text-[15px] font-medium leading-6 text-text-1 transition-colors hover:text-gold"
        >
          {item.title}
        </a>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
          <SourceChip source={item.source} />
          <RegionTag region={item.region} />
          <CategoryTag category={item.category} />
          <span className="tnum font-mono text-text-3" title={absoluteTime(item.publishedAt)}>
            {relativeTime(item.publishedAt, now)}
          </span>
          {isNew && (
            <span className="rounded-full bg-gold/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gold">
              NEW
            </span>
          )}
        </div>
      </div>
      {/* hover 操作列 */}
      <div className="flex shrink-0 flex-col items-center justify-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <button
          type="button"
          title="生成选题"
          onClick={() => navigate(`/topics?focus=${item.id}`)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-surface-3 hover:text-gold"
        >
          <Sparkles size={16} />
        </button>
        <button
          type="button"
          title={saved ? '取消收藏' : '收藏'}
          onClick={() => onToggleSave(item.id)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-surface-3',
            saved ? 'text-gold' : 'text-text-2 hover:text-text-1',
          )}
        >
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} className={cn(saved && 'scale-110')} />
        </button>
      </div>
    </motion.article>
  )
}

export default function FeedStream({
  category,
  onCategoryChange,
  highlightId,
}: {
  category: CatFilter
  onCategoryChange: (c: CatFilter) => void
  highlightId: string | null
}) {
  const { items, status, lastNew, nextRefreshAt, refresh } = useNewsFeed()
  const now = useNow(1000)
  const [region, setRegion] = useState<RegionFilter>('全部')
  const [sort, setSort] = useState<SortMode>('heat')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const newTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 新热点进入：NEW 小丸 6s 后淡出
  useEffect(() => {
    if (!lastNew.length) return
    setNewIds(new Set(lastNew.map((i) => i.id)))
    if (newTimer.current) clearTimeout(newTimer.current)
    newTimer.current = setTimeout(() => setNewIds(new Set()), 6000)
    return () => {
      if (newTimer.current) clearTimeout(newTimer.current)
    }
  }, [lastNew])

  const filtered = useMemo(() => {
    const list = items.filter(
      (i) => (category === '全部' || i.category === category) && (region === '全部' || i.region === region),
    )
    return [...list].sort((a, b) => (sort === 'heat' ? b.heat - a.heat : b.publishedAt - a.publishedAt))
  }, [items, category, region, sort])

  const shown = filtered.slice(0, visible)

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        toast('已取消收藏')
      } else {
        next.add(id)
        toast('已收藏热点')
      }
      return next
    })
  }

  const resetFilters = () => {
    onCategoryChange('全部')
    setRegion('全部')
    setVisible(PAGE_SIZE)
  }

  const remain = Math.max(0, nextRefreshAt - now)

  return (
    <motion.section
      id="feed"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="overflow-hidden rounded-xl border border-line bg-surface-1"
    >
      <div className="max-h-[860px] overflow-y-auto scroll-thin">
        {/* 工具头（sticky 于卡内顶部） */}
        <div className="sticky top-0 z-20 border-b border-line bg-surface-1/95 p-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex items-center gap-2.5">
              <h3 className="text-[17px] font-medium text-text-1">实时热点流</h3>
              <DataStatusBadge status={status} />
              <span className="tnum font-mono text-xs text-text-3">共 {filtered.length} 条</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSort((s) => (s === 'heat' ? 'time' : 'heat'))}
                className="group flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-text-2 transition-colors hover:border-gold/60 hover:text-text-1"
                title="点击切换排序"
              >
                {sort === 'heat' ? '按热度' : '按时间'}
                <ArrowDownUp size={12} className="transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <CountdownRing progress={remain / POLL_INTERVAL_MS} onClick={refresh} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <SegmentedTabs<CatFilter>
              layoutId="feed-cat-tab"
              options={[
                { value: '全部', label: '全部' },
                ...CATEGORIES.map((c) => ({ value: c as CatFilter, label: CATEGORY_SHORT[c] })),
              ]}
              value={category}
              onChange={(c) => {
                onCategoryChange(c)
                setVisible(PAGE_SIZE)
              }}
              className="max-w-full"
            />
            <div className="flex items-center gap-1">
              {(['全部', ...REGIONS] as RegionFilter[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRegion(r)
                    setVisible(PAGE_SIZE)
                  }}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs transition-colors',
                    region === r
                      ? 'border-gold/60 text-gold'
                      : 'border-line text-text-3 hover:border-gold/40 hover:text-text-2',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 列表 */}
        {shown.length > 0 ? (
          <div>
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((item, i) => (
                <FeedItem
                  key={item.id}
                  item={item}
                  index={i}
                  isNew={newIds.has(item.id)}
                  highlighted={highlightId === item.id}
                  saved={savedIds.has(item.id)}
                  onToggleSave={toggleSave}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState
            title="该分类暂无热点，试试切换区域"
            hint="或重置筛选查看全部热点"
            action={
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-4 text-sm text-text-1 transition-colors hover:border-gold/60"
              >
                <RotateCcw size={14} />
                重置筛选
              </button>
            }
          />
        )}

        {/* 加载更多 */}
        {filtered.length > visible && (
          <div className="flex justify-center border-t border-line p-4">
            <button
              type="button"
              onClick={() => setVisible((v) => v + LOAD_STEP)}
              className="h-9 rounded-lg border border-line px-5 text-sm text-text-1 transition-colors hover:border-gold/60 hover:text-gold"
            >
              加载更多（剩余 {filtered.length - visible} 条）
            </button>
          </div>
        )}
      </div>
    </motion.section>
  )
}
