import { useEffect, useState } from 'react'
import type { MarketQuote } from '@/data/markets'

/** tick 中的行情：附带推算出的昨收（tick 锚点） */
export type LiveQuote<T extends MarketQuote = MarketQuote> = T & { prevClose: number }

export type FlashDir = 'up' | 'down'
export type FlashMap = Record<string, FlashDir | undefined>

function toLive<T extends MarketQuote>(groups: T[][]): LiveQuote<T>[][] {
  return groups.map((g) =>
    g.map((q) => ({ ...q, spark: [...q.spark], prevClose: q.price / (1 + q.changePct / 100) })),
  )
}

/**
 * 演示行情随机游走 tick（markets.md：随轮询小幅随机游走，模拟实时）。
 * 每 intervalMs 对所有报价做一次 ±0.09% 内的小幅游走：
 * price/changePct/spark 同步更新，并给出 200ms 的红/绿底色闪烁方向表。
 * initial 变化（如真实行情快照到达/刷新）时重置基准：游走以快照价为基准；
 * 无快照时 initial 保持同一引用，行为与现状一致。
 */
export function useDemoQuotes<T extends MarketQuote>(
  initial: T[][],
  intervalMs = 5000,
): { groups: LiveQuote<T>[][]; flashes: FlashMap } {
  const [state, setState] = useState(() => ({ groups: toLive(initial), flashes: {} as FlashMap }))

  // 快照到达/更新 → 以新基准重建（prevClose 由快照价与涨跌幅反推）
  useEffect(() => {
    setState({ groups: toLive(initial), flashes: {} })
  }, [initial])

  useEffect(() => {
    let flashTimer: ReturnType<typeof setTimeout> | null = null
    const iv = setInterval(() => {
      setState((prev) => {
        const dirs: FlashMap = {}
        const groups = prev.groups.map((g) =>
          g.map((q) => {
            const drift = (Math.random() - 0.5) * 0.0018
            if (Math.abs(drift) < 0.0002) return q
            const price = Math.max(q.price * (1 + drift), 1e-6)
            dirs[q.id] = drift > 0 ? 'up' : 'down'
            return {
              ...q,
              price,
              changePct: (price / q.prevClose - 1) * 100,
              spark: [...q.spark.slice(1), price],
            }
          }),
        )
        return { groups, flashes: dirs }
      })
      if (flashTimer) clearTimeout(flashTimer)
      flashTimer = setTimeout(
        () => setState((prev) => (Object.keys(prev.flashes).length ? { ...prev, flashes: {} } : prev)),
        220,
      )
    }, intervalMs)
    return () => {
      clearInterval(iv)
      if (flashTimer) clearTimeout(flashTimer)
    }
  }, [intervalMs])

  return state
}
