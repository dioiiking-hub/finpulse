import { useEffect, useState } from 'react'

/** 每 intervalMs 触发一次重渲染的当前时间戳（时钟/相对时间用） */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}
