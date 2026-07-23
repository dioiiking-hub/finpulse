import { Link } from 'react-router'
import { NAV_LINKS } from '@/components/Navbar'
import DataStatusBadge from '@/components/DataStatusBadge'
import { useNewsFeed } from '@/lib/feeds'

/** Footer（design.md §6.3）：三列 + 底行声明 */
export default function Footer() {
  const { status } = useNewsFeed()
  return (
    <footer className="border-t border-line bg-bg-1">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 md:grid-cols-3 md:px-8">
        <div className="space-y-3.5">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="./logo.svg" alt="FinPulse" width={30} height={30} />
            <span className="font-display text-base font-bold text-text-1">FinPulse</span>
            <span className="text-xs text-text-2">财经脉搏</span>
          </Link>
          <p className="text-sm text-text-2">让每一条热点，都成为下一个爆款选题</p>
          <DataStatusBadge status={status} />
        </div>
        <div>
          <p className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-text-3">PAGES</p>
          <ul className="space-y-2.5">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-sm text-text-2 transition-colors hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-text-3">DISCLAIMER</p>
          <ul className="space-y-2.5 text-sm text-text-3">
            <li>数据仅供参考，不构成投资建议</li>
            <li>RSS 内容版权归原出版方所有</li>
            <li>前端演示版 · 数据适配层可插拔，可平滑升级至后端聚合</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-2 px-4 py-4 text-xs text-text-3 md:px-8">
          <span>© 2024 FinPulse 财经脉搏 · 团队协作版</span>
          <span className="text-line">·</span>
          <span>京 ICP 备-演示</span>
        </div>
      </div>
    </footer>
  )
}
