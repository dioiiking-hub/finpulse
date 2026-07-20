import { useEffect, useRef } from 'react'
import { useNewsFeed } from '@/lib/feeds'
import type { Region } from '@/lib/types'

/**
 * Hero 世界地图 Canvas 叠加层（home.md S1）：
 * 7 城脉冲节点 + 3 组贝塞尔弧线飞行点 + 新热点命中炸环。
 * 坐标与 world-dots.svg 共用同一套等距圆柱投影归一化坐标。
 * 离屏（IntersectionObserver）/ reduced-motion 时停止渲染。
 */

interface City {
  name: string
  lon: number
  lat: number
  phase: number // 脉冲相位偏移（秒）
}

const CITIES: City[] = [
  { name: '纽约', lon: -74.01, lat: 40.71, phase: 0 },
  { name: '伦敦', lon: -0.13, lat: 51.51, phase: 0.35 },
  { name: '东京', lon: 139.69, lat: 35.69, phase: 0.7 },
  { name: '新加坡', lon: 103.85, lat: 1.29, phase: 1.05 },
  { name: '上海', lon: 121.47, lat: 31.23, phase: 1.4 },
  { name: '香港', lon: 114.17, lat: 22.32, phase: 1.75 },
  { name: '北京', lon: 116.41, lat: 39.9, phase: 2.1 },
]

const ARCS: { from: string; to: string; period: number }[] = [
  { from: '纽约', to: '上海', period: 4 },
  { from: '伦敦', to: '香港', period: 6 },
  { from: '纽约', to: '伦敦', period: 5 },
]

const REGION_CITY: Record<Region, string> = { 中国: '上海', 美国: '纽约', 全球: '伦敦' }

const toXY = (lon: number, lat: number) => ({ x: (lon + 180) / 360, y: (90 - lat) / 180 })

interface Burst {
  x: number
  y: number
  start: number
}

export default function WorldMapCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const burstsRef = useRef<Burst[]>([])
  const { lastNew } = useNewsFeed()

  // 新热点 → 对应区域城市炸环
  useEffect(() => {
    if (!lastNew.length) return
    const now = performance.now()
    for (const item of lastNew) {
      const city = CITIES.find((c) => c.name === REGION_CITY[item.region])
      if (city) burstsRef.current.push({ ...toXY(city.lon, city.lat), start: now })
    }
    if (burstsRef.current.length > 12) burstsRef.current = burstsRef.current.slice(-12)
  }, [lastNew])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let raf = 0
    let visible = true

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    io.observe(canvas)

    const cityPx = (c: City) => {
      const p = toXY(c.lon, c.lat)
      return { x: p.x * w, y: p.y * h }
    }

    const arcPoints = (a: (typeof ARCS)[number]) => {
      const from = CITIES.find((c) => c.name === a.from)!
      const to = CITIES.find((c) => c.name === a.to)!
      const p1 = cityPx(from)
      const p2 = cityPx(to)
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      const ctrl = {
        x: (p1.x + p2.x) / 2,
        y: Math.min(p1.y, p2.y) - dist * 0.28,
      }
      return { p1, p2, ctrl }
    }

    const quadAt = (p1: { x: number; y: number }, ctrl: { x: number; y: number }, p2: { x: number; y: number }, t: number) => {
      const u = 1 - t
      return {
        x: u * u * p1.x + 2 * u * t * ctrl.x + t * t * p2.x,
        y: u * u * p1.y + 2 * u * t * ctrl.y + t * t * p2.y,
      }
    }

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (!visible || w === 0) return
      ctx.clearRect(0, 0, w, h)

      // 弧线 + 飞行亮点
      for (const a of ARCS) {
        const { p1, p2, ctrl } = arcPoints(a)
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.quadraticCurveTo(ctrl.x, ctrl.y, p2.x, p2.y)
        ctx.strokeStyle = 'rgba(216,169,78,0.20)'
        ctx.lineWidth = 1
        ctx.stroke()
        const t = ((now / 1000) % a.period) / a.period
        const pt = quadAt(p1, ctrl, p2, t)
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(233,192,110,0.95)'
        ctx.shadowColor = 'rgba(216,169,78,0.8)'
        ctx.shadowBlur = 6
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // 城市节点 + 扩散环
      for (const c of CITIES) {
        const { x, y } = cityPx(c)
        const prog = ((now / 1000 + c.phase) % 2.4) / 2.4
        ctx.beginPath()
        ctx.arc(x, y, 4 + prog * 22, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(216,169,78,${(0.7 * (1 - prog)).toFixed(3)})`
        ctx.lineWidth = 1.2
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#D8A94E'
        ctx.shadowColor = 'rgba(216,169,78,0.9)'
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // 热点命中炸环（up 红，1s 消散）
      const nowMs = performance.now()
      burstsRef.current = burstsRef.current.filter((b) => nowMs - b.start < 1000)
      for (const b of burstsRef.current) {
        const age = (nowMs - b.start) / 1000
        const bx = b.x * w
        const by = b.y * h
        ctx.beginPath()
        ctx.arc(bx, by, 4 + age * 30, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(229,72,77,${(0.9 * (1 - age)).toFixed(3)})`
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(bx, by, 3.5 * (1 - age * 0.5), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(229,72,77,${(0.85 * (1 - age)).toFixed(3)})`
        ctx.fill()
      }
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      className={className}
      aria-hidden
    />
  )
}
