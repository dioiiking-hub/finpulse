import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNewsFeed } from '@/lib/feeds'
import { useNow } from '@/lib/useNow'
import { beijingClock, newYorkClock } from '@/lib/time'
import { POLL_INTERVAL_MS } from '@/lib/feeds'
import DataStatusBadge from '@/components/DataStatusBadge'
import CountdownRing from '@/components/CountdownRing'

export const NAV_LINKS = [
  { to: '/', label: '热点监控' },
  { to: '/topics', label: '选题推荐' },
  { to: '/archive', label: '选题归档' },
  { to: '/markets', label: '市场速览' },
  { to: '/about', label: '数据源' },
] as const

/** 双城时钟：北京（秒级）/ 纽约（置灰） */
function DualClock({ className }: { className?: string }) {
  const now = useNow(1000)
  const d = new Date(now)
  return (
    <div className={cn('hidden items-center gap-2 font-mono text-xs lg:flex', className)}>
      <span className="tnum text-text-1">北京 {beijingClock(d)}</span>
      <span className="h-3 w-px bg-line" />
      <span className="tnum text-text-3">纽约 {newYorkClock(d)}</span>
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { status, nextRefreshAt, refresh } = useNewsFeed()
  const now = useNow(1000)
  const remain = Math.max(0, nextRefreshAt - now)
  const secondsLeft = Math.ceil(remain / 1000)

  return (
    <>
    <header className="sticky top-0 z-50 h-16 border-b border-line bg-bg-0/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8">
        {/* 左：logo + 字标 */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="FinPulse 首页">
          <img src="/logo.svg" alt="FinPulse" width={32} height={32} />
          <span className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold tracking-tight text-text-1">FinPulse</span>
            <span className="hidden h-3.5 w-px bg-line sm:block" />
            <span className="hidden text-[13px] font-medium text-text-2 sm:block">财经脉搏</span>
          </span>
        </Link>

        {/* 中：路由导航 */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => {
            const active = l.to === '/' ? location.pathname === '/' : location.pathname.startsWith(l.to)
            return (
              <NavLink
                key={l.to}
                to={l.to}
                className={cn(
                  'relative px-3.5 py-2 text-sm transition-colors duration-150',
                  active ? 'text-text-1' : 'text-text-2 hover:text-text-1',
                )}
              >
                {l.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-gold"
                    transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                  />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* 右：时钟 / 状态 / 倒计时环 */}
        <div className="flex items-center gap-3 md:gap-4">
          <DualClock />
          <span className="hidden h-3 w-px bg-line lg:block" />
          <DataStatusBadge status={status} />
          <CountdownRing
            progress={remain / POLL_INTERVAL_MS}
            secondsLeft={secondsLeft}
            onClick={refresh}
          />
          {/* 移动端菜单 */}
          <button
            type="button"
            aria-label="打开菜单"
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1 md:hidden"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>
    </header>

      {/* 移动端全屏抽屉（移出 header：header 的 backdrop-blur 会破坏 fixed 定位，导致抽屉背景只剩 64px 高） */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex flex-col bg-bg-0 md:hidden"
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <span className="flex items-center gap-2.5">
                <img src="/logo.svg" alt="" width={28} height={28} />
                <span className="font-display text-base font-bold text-text-1">FinPulse</span>
              </span>
              <button
                type="button"
                aria-label="关闭菜单"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-2 hover:bg-surface-2 hover:text-text-1"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-6 py-8">
              {NAV_LINKS.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <NavLink
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block rounded-lg px-4 py-3.5 text-lg font-medium',
                      location.pathname === l.to ? 'bg-surface-2 text-gold' : 'text-text-1',
                    )}
                  >
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}
            </nav>
            <div className="mt-auto border-t border-line px-6 py-5 font-mono text-xs text-text-3">
              北京 {beijingClock(new Date())} · 纽约 {newYorkClock(new Date())}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
