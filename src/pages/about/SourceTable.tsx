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

/** 信源清单（about.md S3）：重点覆盖中美，兼顾全球宏观 */
const SOURCES: SourceRow[] = [
  { name: '华尔街见闻', region: '中国', type: '快讯·深度', fetch: 'RSS·代理', freq: '~1 min', status: 'ok', statusLabel: '正常', tip: '最近一次拉取成功，解析正常' },
  { name: '财联社', region: '中国', type: '快讯', fetch: 'RSS·代理', freq: '~1 min', status: 'ok', statusLabel: '正常', tip: '最近一次拉取成功，解析正常' },
  { name: '新浪财经', region: '中国', type: '综合', fetch: 'RSS·代理', freq: '~3 min', status: 'ok', statusLabel: '正常', tip: '最近一次拉取成功，解析正常' },
  { name: '东方财富', region: '中国', type: '行情·快讯', fetch: 'RSS·代理', freq: '~5 min', status: 'degraded', statusLabel: '降级', tip: '最近 1 次拉取超时，使用缓存' },
  { name: 'CNBC', region: '美国', type: '综合', fetch: 'RSS·代理', freq: '~2 min', status: 'ok', statusLabel: '正常', tip: '最近一次拉取成功，解析正常' },
  { name: 'MarketWatch', region: '美国', type: '快讯', fetch: 'RSS·代理', freq: '~2 min', status: 'ok', statusLabel: '正常', tip: '最近一次拉取成功，解析正常' },
  { name: 'Reuters', region: '全球', type: '快讯', fetch: 'RSS·代理', freq: '~2 min', status: 'ok', statusLabel: '正常', tip: '最近一次拉取成功，解析正常' },
  { name: 'Yahoo Finance', region: '美国', type: '行情', fetch: 'RSS·代理', freq: '~3 min', status: 'ok', statusLabel: '正常', tip: '最近一次拉取成功，解析正常' },
  { name: '金十数据', region: '全球', type: '快讯', fetch: '备选接入', freq: '—', status: 'pending', statusLabel: '待接入', tip: '规划中：实现同一适配器接口即可接入' },
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
        RSS 内容版权归原出版方所有，本站仅作团队内部选题参考。
      </motion.p>
    </div>
  )
}
