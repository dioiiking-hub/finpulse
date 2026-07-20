/** 时间工具：全站以 Asia/Shanghai 为主时区，纽约时间为辅（design.md §7） */

const pad = (n: number) => String(n).padStart(2, '0')

function partsInTz(date: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = fmt.formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return { h: get('hour') === '24' ? '00' : get('hour'), m: get('minute'), s: get('second') }
}

/** 北京时间 HH:mm:ss */
export function beijingClock(date = new Date(), withSeconds = true): string {
  const { h, m, s } = partsInTz(date, 'Asia/Shanghai')
  return withSeconds ? `${h}:${m}:${s}` : `${h}:${m}`
}

/** 纽约时间 HH:mm */
export function newYorkClock(date = new Date()): string {
  const { h, m } = partsInTz(date, 'America/New_York')
  return `${h}:${m}`
}

/** 相对时间：3分钟前 / 1小时前 / 昨天 */
export function relativeTime(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts)
  const min = Math.floor(diff / 60_000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}小时前`
  return `${Math.floor(hr / 24)}天前`
}

/** 绝对时间（hover title）：今天 14:32:08 */
export function absoluteTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  const hms = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  return `${sameDay ? '今天' : `${d.getMonth() + 1}月${d.getDate()}日`} ${hms} · 来源时间`
}

/** 秒表式每秒 tick hook 用：返回当前时间戳（配合 useEffect setInterval） */
export function nowMs(): number {
  return Date.now()
}
