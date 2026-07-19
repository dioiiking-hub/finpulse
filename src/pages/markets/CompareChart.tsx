import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { fmtChange } from '@/data/markets'
import SegmentedTabs from '@/components/SegmentedTabs'
import { cn } from '@/lib/utils'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]
const MONO = "'JetBrains Mono', Menlo, monospace"

type PeriodKey = '1D' | '1W' | '1M' | '3M' | '1Y'

interface SeriesDef {
  id: string
  name: string
  color: string
  vol: number
  mu: number
}

const SERIES: SeriesDef[] = [
  { id: 'csi300', name: '沪深300', color: '#E5484D', vol: 0.9, mu: 0.1 },
  { id: 'sp500', name: '标普500', color: '#D8A94E', vol: 0.7, mu: 0.08 },
  { id: 'nasdaq', name: '纳斯达克', color: '#6E9FFF', vol: 1.2, mu: 0.13 },
  { id: 'hsi', name: '恒生指数', color: '#43B8A9', vol: 1.0, mu: 0.05 },
]

const PERIODS: PeriodKey[] = ['1D', '1W', '1M', '3M', '1Y']

const PERIOD_CFG: Record<PeriodKey, { n: number; mult: number; kind: 'intraday' | 'day' | 'week' }> = {
  '1D': { n: 49, mult: 0.35, kind: 'intraday' },
  '1W': { n: 7, mult: 0.55, kind: 'day' },
  '1M': { n: 30, mult: 1.0, kind: 'day' },
  '3M': { n: 66, mult: 1.6, kind: 'day' },
  '1Y': { n: 52, mult: 2.4, kind: 'week' },
}

const VB_W = 920
const VB_H = 360
const PAD = { l: 48, r: 64, t: 18, b: 30 }
const PLOT_W = VB_W - PAD.l - PAD.r
const PLOT_H = VB_H - PAD.t - PAD.b

function seededRnd(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

interface CompareData {
  labels: string[]
  values: Record<string, number[]>
}

/** 确定性演示序列：各周期不同种子，归一化以区间首个交易日为 0% */
function buildCompareData(period: PeriodKey): CompareData {
  const { n, mult, kind } = PERIOD_CFG[period]
  const pIdx = PERIODS.indexOf(period)
  const labels: string[] = []
  for (let i = 0; i < n; i++) {
    if (kind === 'intraday') {
      const m = Math.round(9 * 60 + 30 + (i / (n - 1)) * 330)
      labels.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
    } else {
      const d = new Date()
      d.setDate(d.getDate() - (kind === 'week' ? (n - 1 - i) * 7 : n - 1 - i))
      labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
    }
  }
  const values: Record<string, number[]> = {}
  SERIES.forEach((s, si) => {
    const rnd = seededRnd(pIdx * 1009 + si * 97 + 7)
    let v = 100
    const raw = [v]
    for (let i = 1; i < n; i++) {
      v *= 1 + ((rnd() - 0.5) * s.vol * mult + s.mu * mult) / 100
      raw.push(v)
    }
    values[s.id] = raw.map((x) => (x / raw[0] - 1) * 100)
  })
  return { labels, values }
}

/** S3 · 中美指数叠加对比大图（自定义 SVG：十字线 + 跟随 tooltip） */
export default function CompareChart() {
  const [period, setPeriod] = useState<PeriodKey>('1M')
  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SERIES.map((s) => [s.id, true])),
  )
  const [hover, setHover] = useState<{ i: number; py: number } | null>(null)

  const wrapRef = useRef<HTMLDivElement>(null)
  const [cw, setCw] = useState(0)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((es) => setCw(es[0].contentRect.width))
    ro.observe(el)
    setCw(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  const ch = (cw * VB_H) / VB_W

  const data = useMemo(() => buildCompareData(period), [period])
  const visible = SERIES.filter((s) => on[s.id])
  const n = data.labels.length

  // y 域：可见序列（全部隐藏时退化为全部序列）+ 含 0，上下留 10% 余量
  const domSrc = visible.length > 0 ? visible : SERIES
  let yMin = 0
  let yMax = 0
  domSrc.forEach((s) => data.values[s.id].forEach((v) => {
    if (v < yMin) yMin = v
    if (v > yMax) yMax = v
  }))
  const yPad = (yMax - yMin || 1) * 0.12
  yMin -= yPad
  yMax += yPad

  const x = (i: number) => PAD.l + (i / (n - 1)) * PLOT_W
  const y = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * PLOT_H

  // 十字线 / tooltip 跟随（spring stiffness 400, damping 35）
  const cx = useMotionValue(0)
  const tipX = useMotionValue(0)
  const tipY = useMotionValue(0)
  const scx = useSpring(cx, { stiffness: 400, damping: 35 })
  const stx = useSpring(tipX, { stiffness: 400, damping: 35 })
  const sty = useSpring(tipY, { stiffness: 400, damping: 35 })

  const onMove = (e: ReactMouseEvent<SVGRectElement>) => {
    const el = wrapRef.current
    if (!el || cw === 0) return
    const rect = el.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const vx = (px / rect.width) * VB_W
    const i = Math.min(n - 1, Math.max(0, Math.round(((vx - PAD.l) / PLOT_W) * (n - 1))))
    if (hover === null) {
      // 首次进入：直接就位，避免从边缘弹入
      cx.jump(x(i))
      tipX.jump(px)
      tipY.jump(py)
    }
    if (hover === null || hover.i !== i) setHover({ i, py })
    cx.set(x(i))
    tipX.set(px)
    tipY.set(py)
  }
  const onLeave = () => setHover(null)

  const yTicks = Array.from({ length: 5 }, (_, k) => yMin + ((yMax - yMin) * k) / 4)
  const xTicks = Array.from({ length: 6 }, (_, k) => Math.round((k * (n - 1)) / 5))
  const redrawKey = `${period}:${visible.map((s) => s.id).join(',')}`

  // 端点最新值标签（纵向去重叠，最小间距 16px）
  const ends: { s: SeriesDef; v: number; adjY: number }[] = []
  visible
    .map((s) => ({ s, v: data.values[s.id][n - 1] }))
    .sort((a, b) => y(a.v) - y(b.v))
    .forEach((e) => {
      const prev = ends[ends.length - 1]
      ends.push({ ...e, adjY: prev ? Math.max(y(e.v), prev.adjY + 16) : y(e.v) })
    })
  // 超出绘图区底部时整体上移，避免标签被 viewBox 裁切（顶部留 PAD.t 下限）
  const overflow = ends.length > 0 ? ends[ends.length - 1].adjY - (VB_H - PAD.b - 8) : 0
  if (overflow > 0) ends.forEach((e) => (e.adjY = Math.max(e.adjY - overflow, PAD.t + 4)))

  const flipX = hover !== null && hover.i > n * 0.6
  const flipY = hover !== null && hover.py > ch - 140

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="py-10"
    >
      <div className="rounded-xl border border-line bg-surface-1 p-5 md:p-6">
        {/* 头行：标题 + 周期 tabs */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-medium leading-[26px] text-text-1">中美指数叠加对比</h3>
            <p className="mt-1 text-xs text-text-3">归一化区间表现（%）</p>
          </div>
          <SegmentedTabs<PeriodKey>
            options={PERIODS.map((p) => ({ value: p, label: p }))}
            value={period}
            onChange={(p) => {
              setPeriod(p)
              setHover(null)
            }}
            layoutId="compare-period"
            className="font-mono"
          />
        </div>

        {/* 序列开关 chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {SERIES.map((s) => {
            const active = on[s.id]
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setOn((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
                aria-pressed={active}
                className={cn(
                  'flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs transition-all duration-150',
                  active
                    ? 'border-line bg-surface-2 text-text-1'
                    : 'border-line/60 bg-transparent text-text-3 opacity-60 hover:opacity-90',
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: active ? s.color : 'transparent', border: `1.5px solid ${s.color}` }}
                />
                {s.name}
              </button>
            )
          })}
        </div>

        {/* 图表 */}
        <div ref={wrapRef} className="relative mt-4">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="block h-auto w-full select-none" role="img" aria-label="中美指数叠加对比图">
            {/* 横向 gridline + y 轴刻度 */}
            {yTicks.map((v, k) => (
              <g key={k}>
                <line
                  x1={PAD.l}
                  x2={VB_W - PAD.r}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="rgba(151,178,205,0.07)"
                  strokeWidth={1}
                />
                <text x={PAD.l - 8} y={y(v) + 3.5} textAnchor="end" fontSize={11} fill="#5F7183" fontFamily={MONO}>
                  {v.toFixed(1)}%
                </text>
              </g>
            ))}
            {/* 基线 0% 加粗（rgba 0.18） */}
            {yMin < 0 && yMax > 0 && (
              <line
                x1={PAD.l}
                x2={VB_W - PAD.r}
                y1={y(0)}
                y2={y(0)}
                stroke="rgba(151,178,205,0.18)"
                strokeWidth={1.5}
              />
            )}
            {/* x 轴刻度 */}
            {xTicks.map((i, k) => (
              <text
                key={k}
                x={x(i)}
                y={VB_H - 8}
                textAnchor={k === 0 ? 'start' : k === xTicks.length - 1 ? 'end' : 'middle'}
                fontSize={11}
                fill="#5F7183"
                fontFamily={MONO}
              >
                {data.labels[i]}
              </text>
            ))}

            {/* 折线（变更后重绘 600ms，多序列 stagger 80ms） */}
            <g key={redrawKey}>
              {visible.map((s, si) => {
                const d = data.values[s.id]
                  .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
                  .join(' ')
                return (
                  <motion.path
                    key={s.id}
                    d={d}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: si * 0.08, ease: 'easeOut' }}
                  />
                )
              })}
            </g>

            {/* 端点圆点 + 常驻最新值标签 */}
            {ends.map(({ s, v, adjY }) => (
              <g key={s.id}>
                <circle cx={x(n - 1)} cy={y(v)} r={3.5} fill={s.color} stroke="#10161E" strokeWidth={1.5} />
                <g transform={`translate(${VB_W - PAD.r + 10}, ${adjY - 8})`}>
                  <rect width={54} height={16} rx={8} fill="#151D27" stroke="rgba(151,178,205,0.16)" />
                  <text x={27} y={11.5} textAnchor="middle" fontSize={10} fill={s.color} fontFamily={MONO}>
                    {fmtChange(v)}
                  </text>
                </g>
              </g>
            ))}

            {/* 十字线（x 跟随 spring） */}
            <motion.g
              style={{ x: scx }}
              className={cn('transition-opacity duration-150', hover === null ? 'opacity-0' : 'opacity-100')}
            >
              <line x1={0} x2={0} y1={PAD.t} y2={VB_H - PAD.b} stroke="#5F7183" strokeWidth={1} strokeDasharray="4 4" />
              {hover !== null &&
                visible.map((s) => (
                  <circle key={s.id} cy={y(data.values[s.id][hover.i])} r={3.5} fill={s.color} stroke="#070A0E" strokeWidth={1.5} />
                ))}
            </motion.g>

            {/* 事件捕获层 */}
            <rect
              x={PAD.l}
              y={PAD.t}
              width={PLOT_W}
              height={PLOT_H}
              fill="transparent"
              onMouseMove={onMove}
              onMouseLeave={onLeave}
            />
          </svg>

          {/* tooltip（surface-2 卡，跟随光标偏移 12px，近边缘翻转） */}
          <motion.div
            style={{ x: stx, y: sty }}
            className={cn(
              'pointer-events-none absolute left-0 top-0 z-10 transition-opacity duration-150',
              hover === null ? 'opacity-0' : 'opacity-100',
            )}
          >
            <div className={cn('w-max', flipX ? '-translate-x-full pr-3' : 'pl-3', flipY ? '-translate-y-full pb-3' : 'pt-3')}>
              {hover !== null && (
                <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 shadow-lift">
                  <p className="mb-1.5 font-mono text-[11px] text-text-3">{data.labels[hover.i]}</p>
                  <div className="space-y-1">
                    {visible.map((s) => (
                      <div key={s.id} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[11px] text-text-2">{s.name}</span>
                        <span className="tnum ml-auto pl-3 font-mono text-[11px] font-medium" style={{ color: s.color }}>
                          {fmtChange(data.values[s.id][hover.i])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <p className="mt-3 text-[11px] text-text-3">归一化以区间首个交易日为 0%；演示数据，仅作交互样例。</p>
      </div>
    </motion.section>
  )
}
