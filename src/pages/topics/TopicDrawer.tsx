import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Check, Clock, Copy, ExternalLink, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { relativeTime } from '@/lib/time'
import { useNow } from '@/lib/useNow'
import { heatColor } from '@/components/HeatBadge'
import CategoryTag from '@/components/CategoryTag'
import PlatformBadge from '@/components/PlatformBadge'
import type { RichTopic } from './model'
import { GradeBadge, HeatRing, ReasonText, ScoreDimsFull } from './bits'
import { copyText } from './utils'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

const containerV: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
}

const blockV: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
}

function Block({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={blockV} className={className}>
      {children}
    </motion.div>
  )
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-2.5 text-[11px] tracking-[0.08em] text-text-3">{children}</p>
}

/** S4 · 选题详情抽屉（右侧 520px / mobile 全屏，spring 入场，esc/遮罩关闭） */
export default function TopicDrawer({
  topic,
  inLibrary,
  onToggleLibrary,
  onClose,
  onLocate,
  readOnly,
}: {
  topic: RichTopic | null
  inLibrary: boolean
  onToggleLibrary: (t: RichTopic) => void
  onClose: () => void
  onLocate: (newsId: string | null) => void
  /** 只读模式（如归档页）：隐藏「加入选题库」操作，保留查看/复制 */
  readOnly?: boolean
}) {
  const now = useNow(30_000)
  const open = topic != null

  // esc 关闭 + 背景滚动锁定
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = prevOverflow
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {topic && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="选题详情">
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black"
          />
          {/* 抽屉面板（data-lenis-prevent：Lenis 放行内部原生滚动，见 lenis 文档 prevent） */}
          <motion.aside
            data-lenis-prevent="true"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="absolute right-0 top-0 flex h-full w-full flex-col border-l border-line bg-surface-1 sm:w-[520px]"
          >
            {/* 1. 头部 */}
            <div className="shrink-0 border-b border-line p-5">
              <div className="flex items-center gap-2">
                <GradeBadge grade={topic.grade} />
                {topic.platforms.slice(0, 2).map((p, i) => (
                  <PlatformBadge key={p} platform={p} primary={i === 0} />
                ))}
                <button
                  type="button"
                  aria-label="关闭"
                  onClick={onClose}
                  className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1"
                >
                  <X size={18} />
                </button>
              </div>
              <h2 className="mt-3.5 text-xl font-bold leading-8 text-text-1">{topic.title}</h2>
            </div>

            {/* 滚动内容（h-full flex 列内 flex-1 + overflow-y-auto；Lenis prevent 后 wheel/touch 均走原生滚动） */}
            <motion.div
              data-lenis-prevent="true"
              variants={containerV}
              initial="hidden"
              animate="show"
              className="flex-1 overflow-y-auto scroll-thin p-5"
            >
              {/* 2. 热度环 + 元信息 */}
              <Block className="flex items-center gap-5">
                <HeatRing heat={topic.heat} size={96} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CategoryTag category={topic.category} />
                  </div>
                  <p className="mt-2.5 text-xs text-text-2">
                    来源 <span className="text-text-1">{topic.source}</span>
                  </p>
                  <p className="tnum mt-1 font-mono text-[11px] text-text-3">
                    热点起于 {relativeTime(topic.publishedAt, now)}
                  </p>
                </div>
              </Block>

              {/* 3. 评分构成 */}
              <Block className="mt-7">
                <Label>评分构成</Label>
                <ScoreDimsFull dims={topic.dims} />
              </Block>

              {/* 4. 推荐理由 */}
              <Block className="mt-7">
                <Label>推荐理由</Label>
                <div className="rounded-lg border-l-2 border-gold bg-surface-2 p-3.5">
                  <ReasonText text={topic.reason} className="text-[13px] leading-6 text-text-1/85" />
                  <p className="mt-2.5 border-t border-line pt-2.5 text-xs leading-5 text-text-3">
                    {topic.audience}
                  </p>
                </div>
              </Block>

              {/* 4.5 建议切入角度 */}
              <Block className="mt-7">
                <Label>建议切入角度</Label>
                <div className="rounded-lg border-l-2 border-gold bg-surface-2 p-3.5">
                  <p className="text-[13px] leading-6 text-text-1/85">{topic.angle}</p>
                </div>
              </Block>

              {/* 5. 建议大纲（播客主适配时显示「对谈提纲」） */}
              <Block className="mt-7">
                <Label>{topic.platforms[0] === '播客' ? '对谈提纲' : '建议大纲'}</Label>
                <ol className="flex flex-col gap-2.5">
                  {topic.outline.map((o, i) => (
                    <li key={o} className="flex items-start gap-2.5 text-[13px] leading-6 text-text-1">
                      <span className="tnum mt-px font-mono text-xs font-medium text-gold">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {o}
                    </li>
                  ))}
                </ol>
              </Block>

              {/* 6. 备选标题 */}
              <Block className="mt-7">
                <Label>备选标题 ×{topic.altTitles.length}</Label>
                <div className="flex flex-col gap-1">
                  {topic.altTitles.map((alt) => (
                    <div
                      key={alt}
                      className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2"
                    >
                      <span className="text-[13px] leading-5 text-text-1">{alt}</span>
                      <button
                        type="button"
                        title="复制该标题"
                        onClick={() => void copyText(alt, '标题已复制')}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-3 transition-colors hover:bg-surface-3 hover:text-gold"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </Block>

              {/* 7. 最佳发布时间 */}
              <Block className="mt-7">
                <Label>最佳发布时间</Label>
                <div className="flex items-start gap-2.5 rounded-lg border-l-2 border-gold bg-surface-2 p-3.5">
                  <Clock size={15} className="mt-0.5 shrink-0 text-gold" />
                  <p className="text-[13px] leading-6 text-text-1/85">{topic.bestTime}</p>
                </div>
              </Block>

              {/* 8. 关联热点 */}
              {topic.related.length > 0 && (
                <Block className="mt-7">
                  <Label>关联热点</Label>
                  <div className="flex flex-col gap-1">
                    {topic.related.map((r) => {
                      const inner = (
                        <>
                          <span
                            className="tnum w-7 shrink-0 font-mono text-sm font-bold"
                            style={{ color: r.heat != null ? heatColor(r.heat) : '#5F7183' }}
                          >
                            {r.heat ?? '—'}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] leading-5 text-text-1">{r.title}</span>
                            <span className="tnum mt-0.5 block font-mono text-[11px] text-text-3">
                              {[r.source, r.publishedAt != null ? relativeTime(r.publishedAt, now) : null]
                                .filter(Boolean)
                                .join(' · ') || '跳转热点监控定位'}
                            </span>
                          </span>
                          {r.url && <ExternalLink size={12} className="shrink-0 text-text-3" />}
                        </>
                      )
                      const cls = 'flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-2'
                      return r.url ? (
                        <a
                          key={r.title}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="查看原始报道"
                          className={cls}
                        >
                          {inner}
                        </a>
                      ) : (
                        <button key={r.title} type="button" onClick={() => onLocate(r.newsId)} className={cls}>
                          {inner}
                        </button>
                      )
                    })}
                  </div>
                </Block>
              )}
              <div className="h-2" />
            </motion.div>

            {/* 9. 底部固定操作条 */}
            <div className="flex shrink-0 items-center gap-3 border-t border-line bg-surface-1 p-4">
              {!readOnly && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => onToggleLibrary(topic)}
                className={cn(
                  'inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors duration-200',
                  inLibrary
                    ? 'border border-gold/60 bg-gold/10 text-gold'
                    : 'bg-gold text-on-gold hover:bg-gold-hover',
                )}
              >
                {inLibrary ? <Check size={16} /> : <Plus size={16} />}
                {inLibrary ? '已在选题库' : '加入选题库'}
              </motion.button>
              )}
              <button
                type="button"
                onClick={() =>
                  void copyText(
                    `《${topic.title}》建议大纲\n${topic.outline.map((o, i) => `${i + 1}. ${o}`).join('\n')}`,
                    '大纲已复制',
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-5 text-sm text-text-1 transition-colors hover:border-gold/60 hover:text-gold"
              >
                <Copy size={15} />
                复制大纲
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
