import { Clapperboard, FileText, MessageCircle, Radio } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Platform } from '@/lib/types'

const PLATFORM_ICONS: Record<Platform, LucideIcon> = {
  公众号深度: FileText,
  短视频快评: Clapperboard,
  微博快讯: MessageCircle,
  直播话题: Radio,
}

/**
 * PlatformBadge（design.md §6.4）：主适配 = gold 边 + gold 文字；次适配 = line 边 + text-2。
 */
export default function PlatformBadge({
  platform,
  primary = false,
  className,
}: {
  platform: Platform
  primary?: boolean
  className?: string
}) {
  const Icon = PLATFORM_ICONS[platform]
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs',
        primary ? 'border-gold/60 text-gold' : 'border-line text-text-2',
        className,
      )}
    >
      <Icon size={12} strokeWidth={1.8} />
      {platform}
    </span>
  )
}
