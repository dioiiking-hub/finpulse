import { useCallback, useEffect, useRef, useState } from 'react'
import type { Category, NewsItem } from '@/lib/types'
import TickerTape from '@/components/TickerTape'
import Hero from '@/pages/home/Hero'
import FeedStream from '@/pages/home/FeedStream'
import Sidebar from '@/pages/home/Sidebar'
import ChinaUS from '@/pages/home/ChinaUS'
import { FinalCTA, Workflow } from '@/pages/home/Workflow'

/**
 * 热点监控大屏 `/`（home.md）：
 * S1 Hero 指挥舱 / S2 TickerTape / S3 监控主区 / S4 中美瞭望 / S5 工作流 / S6 CTA。
 */
export default function Home() {
  const [category, setCategory] = useState<'全部' | Category>('全部')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const hlTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 热度榜点击 → 滚动定位到 FeedItem + 高亮闪烁 1.2s
  const handlePickItem = useCallback((item: NewsItem) => {
    setCategory('全部')
    setHighlightId(item.id)
    requestAnimationFrame(() => {
      document.getElementById(`feed-item-${item.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
    if (hlTimer.current) clearTimeout(hlTimer.current)
    hlTimer.current = setTimeout(() => setHighlightId(null), 1600)
  }, [])

  useEffect(
    () => () => {
      if (hlTimer.current) clearTimeout(hlTimer.current)
    },
    [],
  )

  return (
    <>
      <Hero />
      <TickerTape />
      {/* S3 监控主区 */}
      <section className="bg-bg-0 py-10">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-4 md:px-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <FeedStream category={category} onCategoryChange={setCategory} highlightId={highlightId} />
          </div>
          <aside className="lg:col-span-4">
            <Sidebar category={category} onCategoryChange={setCategory} onPickItem={handlePickItem} />
          </aside>
        </div>
      </section>
      <ChinaUS />
      <Workflow />
      <FinalCTA />
    </>
  )
}
