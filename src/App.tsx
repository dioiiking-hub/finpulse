import { useEffect } from 'react'
import { Routes, Route } from 'react-router'
import Lenis from 'lenis'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Topics from '@/pages/Topics'
import Markets from '@/pages/Markets'
import About from '@/pages/About'
import { registerLenis } from '@/lib/scroll'

export default function App() {
  // 全站 Lenis 平滑滚动（lerp 0.1，design.md §5）
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.1 })
    registerLenis(lenis)
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      registerLenis(null)
    }
  }, [])

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="topics" element={<Topics />} />
        <Route path="markets" element={<Markets />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  )
}
