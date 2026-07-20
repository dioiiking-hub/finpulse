/**
 * 锚点定位金色闪烁遮罩（TickerTape / 中美瞭望 跳转 `/markets#<id>` 时高亮 1.2s）。
 * 覆盖在目标卡/行上，pointer-events 不拦截。
 */
export default function FlashOverlay({ rounded = 'rounded-xl' }: { rounded?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-10 border-2 border-gold/80 bg-gold/[0.06] ${rounded}`}
      style={{ animation: 'flash-gold 1.2s ease-in-out 1 both' }}
    />
  )
}
