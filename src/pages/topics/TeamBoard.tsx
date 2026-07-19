import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, MoveHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category, Platform } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/types'
import PlatformBadge from '@/components/PlatformBadge'
import { toast } from '@/components/Toast'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

type ClaimStatus = '策划中' | '撰稿中' | '已排期' | '已发布'

interface TeamTopic {
  title: string
  owner: string
  status: ClaimStatus
  platform: Platform
  category: Category
  claimedAt: string
}

const TEAM: TeamTopic[] = [
  { title: '美联储降息预期重燃', owner: '李编辑', status: '撰稿中', platform: '公众号深度', category: '宏观政策', claimedAt: '认领于 2 小时前' },
  { title: '英伟达财报三个新信号', owner: '王主笔', status: '策划中', platform: '短视频快评', category: '科技AI', claimedAt: '认领于 45 分钟前' },
  { title: '金价新高还能上车吗', owner: '陈运营', status: '已发布', platform: '微博快讯', category: '大宗商品', claimedAt: '认领于 昨天 18:20' },
  { title: '程序化交易新规解读', owner: '李编辑', status: '策划中', platform: '直播话题', category: '监管地缘', claimedAt: '认领于 1 小时前' },
  { title: '万亿成交资金拆解', owner: '周分析', status: '撰稿中', platform: '公众号深度', category: 'A股港股', claimedAt: '认领于 3 小时前' },
  { title: '人民币 7.12 与出口企业', owner: '王主笔', status: '已排期', platform: '微博快讯', category: '宏观政策', claimedAt: '认领于 5 小时前' },
]

/** 已认领基数（页头统计用） */
export const TEAM_COUNT = TEAM.length

const STATUS_STYLE: Record<ClaimStatus, string> = {
  策划中: 'border-line text-text-3',
  撰稿中: 'border-gold/60 text-gold',
  已排期: 'border-us-blue/60 text-us-blue',
  已发布: 'border-down/60 text-down',
}

const STATUS_DOT: Record<ClaimStatus, string> = {
  策划中: 'bg-text-3',
  撰稿中: 'bg-gold',
  已排期: 'bg-us-blue',
  已发布: 'bg-down',
}

/** S6 · 团队选题库（横向可拖拽滚动条，framer drag="x"） */
export default function TeamBoard() {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragLimit, setDragLimit] = useState(0)

  useEffect(() => {
    const measure = () => {
      const c = containerRef.current
      const t = trackRef.current
      if (c && t) setDragLimit(Math.max(0, t.scrollWidth - c.clientWidth))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <section className="border-t border-line bg-bg-0 py-24">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        {/* 分区头 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14"
        >
          <div>
            <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold">
              <span className="inline-block h-3 w-0.5 bg-gold" />
              TEAM BOARD
            </p>
            <h2 className="mt-3 text-2xl font-bold leading-8 text-text-1 md:text-[28px] md:leading-9">团队选题库</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-1.5 text-[11px] text-text-3 md:flex">
              <MoveHorizontal size={13} />
              按住拖拽查看更多
            </span>
            <button
              type="button"
              disabled
              title="协作版功能"
              className="inline-flex h-10 cursor-not-allowed items-center gap-1.5 rounded-lg border border-line px-5 text-sm text-text-1 opacity-40"
            >
              查看全部
              <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* 拖拽条（左右出血，容器内对齐） */}
      <div ref={containerRef} className="overflow-hidden">
        <motion.div
          ref={trackRef}
          drag="x"
          dragConstraints={{ left: -dragLimit, right: 0 }}
          dragElastic={0.06}
          className="flex w-max cursor-grab gap-5 px-4 active:cursor-grabbing md:px-[max(2rem,calc((100vw-1440px)/2+2rem))]"
        >
          {TEAM.map((t, i) => {
            const color = CATEGORY_COLORS[t.category]
            return (
              <motion.div
                key={t.title}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.08, duration: 0.45, ease: EASE }}
                whileHover={{ y: -4 }}
                onTap={() => toast('协作版功能：选题详情与评论区即将上线')}
                className="w-80 shrink-0 select-none rounded-xl border border-line bg-surface-1 p-5 transition-[border-color,box-shadow] duration-200 hover:border-gold/40 hover:shadow-lift"
              >
                <p className="text-[15px] font-medium leading-6 text-text-1">《{t.title}》</p>
                <div className="mt-4 flex items-center gap-2.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${color}1A`, color, boxShadow: `inset 0 0 0 1px ${color}55` }}
                  >
                    {t.owner.slice(0, 1)}
                  </span>
                  <span className="text-[13px] text-text-2">{t.owner}</span>
                  <span
                    className={cn(
                      'ml-auto inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-[11px] transition-colors duration-200',
                      STATUS_STYLE[t.status],
                    )}
                  >
                    <span className={cn('h-1 w-1 rounded-full', STATUS_DOT[t.status])} />
                    {t.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
                  <PlatformBadge platform={t.platform} />
                  <span className="tnum font-mono text-[11px] text-text-3">{t.claimedAt}</span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
