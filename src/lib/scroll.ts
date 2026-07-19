import type Lenis from 'lenis'

/** 模块级 Lenis 单例引用（App 挂载时注册），锚点滚动统一走 Lenis，offset 避开固定导航 */
let lenis: Lenis | null = null

export function registerLenis(instance: Lenis | null) {
  lenis = instance
}

export function scrollToId(id: string, offset = -80) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) {
    lenis.scrollTo(el, { offset, duration: 1.1 })
  } else {
    const y = el.getBoundingClientRect().top + window.scrollY + offset
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}
