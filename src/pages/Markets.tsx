import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { TICKER_ITEMS, fmtChange, fmtPrice } from '@/data/markets'
import Sparkline from '@/components/Sparkline'
import { cn } from '@/lib/utils'

/** 市场速览（占位 stub，完整页由页面代理实现） */
export default function Markets() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8">
      <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold">
        <span className="inline-block h-3 w-0.5 bg-gold" />
        MARKETS
      </p>
      <h1 className="mt-3 text-3xl font-black leading-10 text-text-1 md:text-4xl">市场速览</h1>
      <p className="mt-3 max-w-[560px] text-sm leading-6 text-text-2">
        中美指数对比、汇率大宗加密与财经日历即将上线。以下为演示行情预览：
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {TICKER_ITEMS.slice(0, 8).map((q) => (
          <div key={q.id} id={q.id} className="rounded-xl border border-line bg-surface-1 p-4">
            <p className="text-xs text-text-3">{q.name}</p>
            <p className="tnum mt-1 font-mono text-lg font-bold text-text-1">{fmtPrice(q)}</p>
            <div className="mt-1 flex items-center justify-between">
              <span className={cn('tnum font-mono text-xs font-medium', q.changePct >= 0 ? 'text-up' : 'text-down')}>
                {fmtChange(q.changePct)}
              </span>
              <Sparkline data={q.spark} width={64} height={20} />
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
      </Link>
    </div>
  )
}
