import { Link } from 'react-router'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useNewsFeed } from '@/lib/feeds'
import { generateTopics } from '@/lib/recommend'
import PlatformBadge from '@/components/PlatformBadge'
import CategoryTag from '@/components/CategoryTag'

/** 选题推荐（占位 stub，完整页由页面代理实现） */
export default function Topics() {
  const { items } = useNewsFeed()
  const preview = generateTopics(items, 3)
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8">
      <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold">
        <span className="inline-block h-3 w-0.5 bg-gold" />
        TOPIC ENGINE
      </p>
      <h1 className="mt-3 text-3xl font-black leading-10 text-text-1 md:text-4xl">选题推荐</h1>
      <p className="mt-3 max-w-[560px] text-sm leading-6 text-text-2">
        基于热度评分引擎的选题标题、推荐理由与平台适配建议即将上线。以下为实时数据生成的预览：
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {preview.map((t) => (
          <div key={t.id} className="rounded-xl border border-line bg-surface-1 p-5">
            <div className="mb-3 flex items-center justify-between">
              <CategoryTag category={t.category} />
              <span className="tnum font-mono text-lg font-bold text-gold">{t.score}</span>
            </div>
            <p className="line-clamp-3 text-sm font-medium leading-6 text-text-1">{t.title}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {t.platforms.map((p, i) => (
                <PlatformBadge key={p} platform={p} primary={i === 0} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <Link
        to="/"
        className="mt-10 inline-flex h-10 items-center gap-2 rounded-lg border border-line px-5 text-sm text-text-1 transition-colors hover:border-gold/60"
      >
        <ArrowLeft size={15} />
        返回热点监控
        <Sparkles size={14} className="text-gold" />
      </Link>
    </div>
  )
}
