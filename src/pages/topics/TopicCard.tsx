import type { Ref } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Bookmark, Check, Copy, Flame, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import HeatBadge from '@/components/HeatBadge'
import CategoryTag from '@/components/CategoryTag'
import PlatformBadge from '@/components/PlatformBadge'
import type { RichTopic } from './model'
import { GoldenChip, GradeBadge, ReasonText, ScoreDimsMini } from './bits'
import { copyText } from './utils'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

/** S3 · 选题推荐卡（topics.md）：等级 + 热度 + 时效 / 标题 / 理由 / 平台 / 关联热点 / 角度 / 评分 + 操作 */
export default function TopicCard({
  topic: t,
  index,
  saved,
  inLibrary,
  onToggleSave,
  onToggleLibrary,
  onOpen,
  onLocate,
  ref,
}: {
  topic: RichTopic
  index: number
  saved: boolean
  inLibrary: boolean
  onToggleSave: (t: RichTopic) => void
  onToggleLibrary: (t: RichTopic) => void
  onOpen: (t: RichTopic) => void
  onLocate: (newsId: string | null) => void
  /** AnimatePresence popLayout 需要 ref 测量 DOM（React 19 ref-as-prop） */
  ref?: Ref<HTMLElement>
}) {
  return (
    <motion.article
      ref={ref}
      layout="position"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.18 } }}
      transition={{
        duration: 0.45,
        delay: Math.min(index, 8) * 0.07,
        ease: EASE,
        layout: { duration: 0.25, ease: EASE },
      }}
      whileHover={{ y: -2 }}
      className="flex flex-col rounded-xl border border-line bg-surface-1 p-6 transition-[border-color,box-shadow] duration-200 hover:border-gold/40 hover:shadow-lift"
    >
      {/* 1. 顶行：等级 + 分类 / 时效 chip + 热度 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <GradeBadge grade={t.grade} />
          <CategoryTag category={t.category} />
        </div>
        <div className="flex items-center gap-3">
          {t.goldenUntil && <GoldenChip until={t.goldenUntil} />}
          <HeatBadge heat={t.heat} barWidth={56} />
        </div>
      </div>

      {/* 2. 选题标题 */}
      <button
        type="button"
        onClick={() => onOpen(t)}
        className="mt-3.5 text-left text-lg font-medium leading-7 text-text-1 line-clamp-2 transition-colors duration-150 hover:text-gold"
      >
        {t.title}
      </button>

      {/* 3. 推荐理由块 */}
      <div className="mt-3.5 rounded-lg border-l-2 border-gold bg-surface-2 p-3.5">
        <p className="text-[11px] tracking-[0.08em] text-text-3">为什么值得做</p>
        <ReasonText text={t.reason} className="mt-1.5 text-[13px] leading-6 text-text-1/85" />
      </div>

      {/* 4. 适配平台行 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {t.platforms.slice(0, 2).map((p, i) => (
          <PlatformBadge key={p} platform={p} primary={i === 0} />
        ))}
        <span className="text-xs text-text-3">{t.estimate}</span>
      </div>

      {/* 5. 关联热点 chips */}
      {t.related.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {t.related.slice(0, 3).map((r) => (
            <button
              key={r.title}
              type="button"
              title={r.heat != null ? `热度 ${r.heat}${r.source ? ` · ${r.source}` : ''} · 点击定位热点` : '点击跳转热点监控'}
              onClick={() => onLocate(r.newsId)}
              className="inline-flex h-6 max-w-full items-center gap-1.5 rounded-full bg-surface-3 px-2.5 text-xs text-text-2 transition-colors duration-150 hover:text-gold"
            >
              <Flame size={11} className="shrink-0 text-gold" />
              <span className="truncate">{r.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* 6. 建议切入角度 */}
      <p className="mt-3.5 text-[13px] leading-6 text-text-2">
        <span className="font-medium text-gold">角度 › </span>
        {t.angle}
      </p>

      {/* 7. 底行：评分构成 + 操作组 */}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t border-line pt-4">
        <ScoreDimsMini dims={t.dims} />
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            title={saved ? '取消收藏' : '收藏'}
            onClick={() => onToggleSave(t)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-surface-2',
              saved ? 'text-gold' : 'text-text-2 hover:text-text-1',
            )}
          >
            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            title="复制标题"
            onClick={() => void copyText(t.title, '标题已复制')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-2 transition-colors duration-150 hover:bg-surface-2 hover:text-text-1"
          >
            <Copy size={16} />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => onToggleLibrary(t)}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors duration-200',
              inLibrary
                ? 'bg-gold text-on-gold'
                : 'border border-line text-text-1 hover:border-gold/60 hover:text-gold',
            )}
          >
            {inLibrary ? <Check size={14} /> : <Plus size={14} />}
            {inLibrary ? '已在选题库' : '加入选题库'}
          </motion.button>
          <button
            type="button"
            onClick={() => onOpen(t)}
            className="group inline-flex h-9 items-center gap-1 px-2 text-xs font-medium text-gold transition-colors hover:text-gold-hover"
          >
            详情
            <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.article>
  )
}
