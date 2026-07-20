import { motion } from 'framer-motion'
import type { Region } from '@/lib/types'
import RegionTag from '@/components/RegionTag'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

type SourceStatus = 'ok' | 'degraded' | 'pending'

interface SourceRow {
  name: string
  region: Region
  type: string
  fetch: string
  freq: string
  status: SourceStatus
  statusLabel: string
  tip: string
}

/** 信源清单（about.md S3，fix-v2 与 src/lib/feeds.ts 实际源同步）：RSSHub 主链路 + 直连/代理降级链 + 行情快照 */
const SOURCES: SourceRow[] = [
  { name: '财联社电报', region: '中国', type: '快讯', fetch: 'RSSHub 直连', freq: '~5 min', status: 'ok', statusLabel: '正常', tip: 'RSSHub /cls/telegraph，双实例互备，5 分钟级中文快讯，最高优先级' },
  { name: '华尔街见闻·快讯', region: '中国', type: '快讯', fetch: 'RSSHub 直连', freq: '~5 min', status: 'ok', statusLabel: '正常', tip: 'RSSHub /wallstreetcn/live，双实例互备' },
  { name: '华尔街见闻·新闻', region: '中国', type: '深度', fetch: 'RSSHub 直连', freq: '~30 min', status: 'ok', statusLabel: '正常', tip: 'RSSHub /wallstreetcn/news，最新文章' },
  { name: '见闻最热', region: '中国', type: '热榜', fetch: 'RSSHub 直连', freq: '~30 min', status: 'ok', statusLabel: '正常', tip: 'RSSHub /wallstreetcn/hot，最热文章榜' },
  { name: '新浪滚动财经', region: '中国', type: '综合', fetch: 'RSSHub 直连', freq: '~5 min', status: 'ok', statusLabel: '正常', tip: 'RSSHub /sina/rollnews/2516，财经滚动' },
  { name: '新浪美股', region: '美国', type: '美股', fetch: 'RSSHub 直连', freq: '~5 min', status: 'ok', statusLabel: '正常', tip: 'RSSHub /sina/rollnews/2518，美股滚动' },
  { name: '金十数据', region: '全球', type: '快讯', fetch: 'RSSHub 直连', freq: '~10 min', status: 'ok', statusLabel: '正常', tip: 'RSSHub /jin10，已接入双实例互备主链路' },
  { name: 'CNBC', region: '美国', type: '综合', fetch: 'RSSHub 直连', freq: '~30 min', status: 'ok', statusLabel: '正常', tip: 'RSSHub /cnbc/rss，英文源（Top News 全文）' },
  { name: 'FT中文网', region: '中国', type: '深度', fetch: 'RSS·代理', freq: '降级链', status: 'degraded', statusLabel: '备份', tip: '直连 RSS + 公共代理降级链：RSSHub 主链路失败时自动启用' },
  { name: 'Reuters', region: '全球', type: '快讯', fetch: 'RSS·代理', freq: '降级链', status: 'degraded', statusLabel: '备份', tip: '直连 RSS + 公共代理降级链：RSSHub 主链路失败时自动启用' },
  { name: 'MarketWatch', region: '美国', type: '快讯', fetch: 'RSS·代理', freq: '降级链', status: 'degraded', statusLabel: '备份', tip: '直连 RSS + 公共代理降级链：RSSHub 主链路失败时自动启用' },
  { name: 'Yahoo Finance', region: '美国', type: '行情·资讯', fetch: 'RSS·代理', freq: '降级链', status: 'degraded', statusLabel: '备份', tip: '直连 RSS + 公共代理降级链：RSSHub 主链路失败时自动启用' },
  { name: '行情快照 iFinD / Yahoo Finance', region: '全球', type: '行情快照', fetch: '插件定时任务', freq: '30 min', status: 'ok', statusLabel: '正常', tip: '30 分钟快照 · 插件定时任务：生成 market-snapshot.json，前端按 id 叠加真实行情，失败回退演示数据' },
]

/** 状态点：正常 = down 绿点 2s 微脉冲；降级 = gold 点；待接入 = text-3 空心点 */
function StatusDot({ status }: { status: SourceStatus }) {
  if (status === 'ok') {
    return (
      <motion.span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-down"
        animate={{ scale: [1, 1.35, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    )
  }
  if (status === 'degraded') {
    return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
  }
  return <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-text-3" />
}

const STATUS_TEXT: Record<SourceStatus, string> = {
  ok: 'text-text-2',
  degraded: 'text-gold',
  pending: 'text-text-3',
}

function StatusCell({ row }: { row: SourceRow }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center gap-1.5">
          <StatusDot status={row.status} />
          <span className={cn('text-xs', STATUS_TEXT[row.status])}>{row.statusLabel}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="border border-line bg-surface-3 text-text-1 [&>svg]:bg-surface-3 [&>svg]:fill-surface-3">
        {row.tip}
      </TooltipContent>
    </Tooltip>
  )
}

/** 信源名：16px 首字方块（surface-3）+ 名称 */
function SourceName({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-surface-3 font-mono text-[10px] font-medium text-text-1">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="text-sm font-medium text-text-1">{name}</span>
    </span>
  )
}

const COLUMNS = ['信源', '区域', '类型', '拉取方式', '更新频率', '状态']

/** S3 · 信源清单：桌面表格 / mobile 卡片列表 */
export default function SourceTable() {
  return (
    <div>
      {/* 桌面表格 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="hidden overflow-hidden rounded-xl border border-line bg-surface-1 md:block"
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line">
              {COLUMNS.map((c) => (
                <th
                  key={c}
                  className="px-4 py-3 font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-text-3"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SOURCES.map((s, i) => (
              <motion.tr
                key={s.name}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                className="border-b border-line transition-colors duration-150 last:border-b-0 hover:bg-surface-2"
              >
                <td className="px-4 py-3.5">
                  <SourceName name={s.name} />
                </td>
                <td className="px-4 py-3.5">
                  <RegionTag region={s.region} />
                </td>
                <td className="px-4 py-3.5 text-[13px] text-text-2">{s.type}</td>
                <td className="px-4 py-3.5 font-mono text-xs text-text-2">{s.fetch}</td>
                <td className="tnum px-4 py-3.5 font-mono text-xs text-text-2">{s.freq}</td>
                <td className="px-4 py-3.5">
                  <StatusCell row={s} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* mobile 卡片列表 */}
      <div className="space-y-3 md:hidden">
        {SOURCES.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
            className="rounded-xl border border-line bg-surface-1 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <SourceName name={s.name} />
              <RegionTag region={s.region} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-3 text-xs">
              <p className="flex items-center justify-between gap-2">
                <span className="text-text-3">类型</span>
                <span className="text-text-2">{s.type}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="text-text-3">拉取方式</span>
                <span className="font-mono text-text-2">{s.fetch}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="text-text-3">更新频率</span>
                <span className="tnum font-mono text-text-2">{s.freq}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="text-text-3">状态</span>
                <StatusCell row={s} />
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 底部注 */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-4 text-[11px] leading-5 text-text-3"
      >
        主链路：RSSHub 公共实例（rsshub.rssforever.com / rsshub.ktachibana.party 双实例互备，8s 超时）；
        失败后回退直连 RSS + 公共代理降级链，最终降级为内置演示数据。RSS 内容版权归原出版方所有，本站仅作团队内部选题参考。
      </motion.p>
    </div>
  )
}
