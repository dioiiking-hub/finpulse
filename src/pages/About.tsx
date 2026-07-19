import { Link } from 'react-router'
import { ArrowLeft, Rss } from 'lucide-react'
import { RSS_SOURCES } from '@/lib/feeds'
import RegionTag from '@/components/RegionTag'

/** 数据源与协作（占位 stub，完整页由页面代理实现） */
export default function About() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8">
      <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold">
        <span className="inline-block h-3 w-0.5 bg-gold" />
        DATA SOURCES
      </p>
      <h1 className="mt-3 text-3xl font-black leading-10 text-text-1 md:text-4xl">数据源与协作</h1>
      <p className="mt-3 max-w-[560px] text-sm leading-6 text-text-2">
        数据链路、信源清单、推荐引擎白皮书与团队工作流说明即将上线。当前接入信源：
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {RSS_SOURCES.map((s) => (
          <div key={s.url} className="flex items-center justify-between rounded-lg border border-line bg-surface-1 px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-text-1">
              <Rss size={13} className="text-gold" />
              {s.name}
            </span>
            <RegionTag region={s.region} />
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-text-3">
        RSS 经公共 CORS 代理拉取，8s 超时自动降级为内置演示数据流；数据适配层可插拔，可平滑升级至后端聚合。
      </p>
      <Link
        to="/"
        className="mt-10 inline-flex h-10 items-center gap-2 rounded-lg border border-line px-5 text-sm text-text-1 transition-colors hover:border-gold/60"
      >
        <ArrowLeft size={15} />
        返回热点监控
      </Link>
    </div>
  )
}
