import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ToastHost } from '@/components/Toast'

/**
 * 全站 Layout（嵌套路由模式：Layout 渲染 <Outlet/>，App.tsx 使用嵌套 <Route>）。
 * Navbar 为 sticky 布局，无需任何页面级顶部偏移。
 */
export default function Layout() {
  const location = useLocation()

  // 路由切换回顶部（Lenis 接管平滑滚动时瞬时跳转）
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg-0 text-text-1">
      <Navbar />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
        className="flex-1"
      >
        <Outlet />
      </motion.main>
      <Footer />
      <ToastHost />
    </div>
  )
}
