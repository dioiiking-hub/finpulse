import type { RefObject } from 'react'
import { motion } from 'framer-motion'
import { Clapperboard, FileText, LayoutGrid, MessageCircle, Podcast, Radio, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category, Platform } from '@/lib/types'
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/types'
import CountUp from '@/components/CountUp'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

export type PlatformFilter = '全部' | Platform
export type SortMode = '综合推荐' | '热度优先' | '时效优先'

const PLATFORM_TABS: { value: PlatformFilter; label: string; icon: LucideIcon }[] = [
  { value: '全部', label: '全部', icon: LayoutGrid },
  { value: '公众号深度', label: '公众号深度', icon: FileText },
  { value: '短视频快评', label: '短视频快评', icon: Clapperboard },
  { value: '微博快讯', label: '微博快讯', icon: MessageCircle },
  { value: '直播话题', label: '直播话题', icon: Radio },
  { value: '播客', label: '播客', icon: Podcast },
]

const SORTS: SortMode[] = ['综合推荐', '热度优先', '时效优先']

/** S2 · 筛选工具栏（sticky top-16）：平台分段 / 分类多选 / 热度滑杆 / 排序 / 搜索 */
export default function FilterBar({
  platform,
  onPlatform,
  cats,
  onToggleCat,
  minHeat,
  onMinHeat,
  sort,
  onSort,
  query,
  onQuery,
  matchCount,
  searchRef,
}: {
  platform: PlatformFilter
  onPlatform: (p: PlatformFilter) => void
  cats: Set<Category>
  onToggleCat: (c: Category) => void
  minHeat: number
  onMinHeat: (v: number) => void
  sort: SortMode
  onSort: (s: SortMode) => void
  query: string
  onQuery: (q: string) => void
  matchCount: number
  searchRef: RefObject<HTMLInputElement | null>
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2, ease: EASE }}
      className="sticky top-16 z-20 border-y border-line bg-bg-0/90 backdrop-blur-md"
    >
      <div className="mx-auto max-w-[1440px] px-4 py-3 md:px-8">
        {/* 行 1：平台分段 + 搜索 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div
            role="tablist"
            aria-label="平台筛选"
            className="inline-flex max-w-full flex-wrap items-center gap-0.5 overflow-x-auto rounded-full bg-surface-1 p-1 scroll-thin"
          >
            {PLATFORM_TABS.map((t) => {
              const active = t.value === platform
              const Icon = t.icon
              return (
                <button
                  key={t.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => onPlatform(t.value)}
                  className={cn(
                    'relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors duration-150',
                    active ? 'text-text-1' : 'text-text-3 hover:text-text-2',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="topics-platform-pill"
                      className="absolute inset-0 rounded-full bg-surface-3"
                      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                    />
                  )}
                  <Icon size={14} className="relative z-10" strokeWidth={1.8} />
                  <span className="relative z-10">{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* 搜索框（⌘K） */}
          <div className="relative ml-auto">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="搜索选题或关键词"
              className="h-9 w-48 rounded-lg border border-line bg-surface-1 pl-8 pr-11 text-xs text-text-1 transition-colors placeholder:text-text-3 focus:border-gold/60 focus:outline-none md:w-56"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-3">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* 行 2：分类多选 + 热度阈值 + 排序 */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex flex-wrap items-center gap-1.5" aria-label="分类筛选">
            {CATEGORIES.map((c) => {
              const color = CATEGORY_COLORS[c]
              const active = cats.has(c)
              return (
                <button
                  key={c}
                  onClick={() => onToggleCat(c)}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors duration-150',
                    !active && 'border-line text-text-3 hover:border-gold/30 hover:text-text-2',
                  )}
                  style={active ? { backgroundColor: `${color}26`, borderColor: `${color}66`, color } : undefined}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                  {c}
                </button>
              )
            })}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-3">
            <label className="flex items-center gap-2.5">
              <span className="text-[11px] text-text-3">热度阈值</span>
              <Slider
                value={[minHeat]}
                onValueChange={(v) => onMinHeat(v[0])}
                min={40}
                max={100}
                step={5}
                className="w-28"
                aria-label="热度阈值"
              />
              <span className="tnum w-8 font-mono text-xs font-medium text-gold">≥{minHeat}</span>
            </label>
            <Select value={sort} onValueChange={(v) => onSort(v as SortMode)}>
              <SelectTrigger className="h-8 w-[124px] border-line bg-surface-1 text-xs text-text-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 行 3：匹配计数 */}
        <div className="mt-2.5 border-t border-line pt-2.5">
          <p className="tnum font-mono text-xs text-text-3">
            匹配 <CountUp value={matchCount} duration={0.2} className="text-text-1" /> 条
          </p>
        </div>
      </div>
    </motion.div>
  )
}
