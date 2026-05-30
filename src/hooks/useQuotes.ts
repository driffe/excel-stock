import { useEffect, useRef, useState } from 'react'
import { getProvider } from '../api'
import { mapPoolSettled } from '../lib/pool'
import type { Quote } from '../types'

const REFRESH_MS = Number(import.meta.env.VITE_REFRESH_MS ?? 15000)
// Cap simultaneous quote requests so we stay under free-tier per-second limits.
const QUOTE_CONCURRENCY = 4

export interface UseQuotesResult {
  quotes: Record<string, Quote>
  lastUpdated: number | null
  loading: boolean
  refresh: () => void
}

/**
 * Polls the active provider for the given symbols every VITE_REFRESH_MS.
 * Returns a symbol -> Quote map. Symbols that error keep their last value.
 */
export function useQuotes(symbols: string[]): UseQuotesResult {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // Keep the latest symbol list available to the interval without re-arming it.
  const symbolsRef = useRef(symbols)
  symbolsRef.current = symbols
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const provider = getProvider()
    let cancelled = false

    async function load() {
      const current = symbolsRef.current.filter((s) => s.trim() !== '')
      if (current.length === 0) {
        setQuotes({})
        return
      }
      setLoading(true)
      const results = await mapPoolSettled(current, QUOTE_CONCURRENCY, (s) =>
        provider.getQuote(s.toUpperCase()),
      )
      if (cancelled) return

      setQuotes((prev) => {
        const next = { ...prev }
        results.forEach((r, i) => {
          const sym = current[i].toUpperCase()
          if (r.status === 'fulfilled') next[sym] = r.value
        })
        // Drop symbols no longer tracked.
        const tracked = new Set(current.map((s) => s.toUpperCase()))
        for (const key of Object.keys(next)) {
          if (!tracked.has(key)) delete next[key]
        }
        return next
      })
      setLastUpdated(Date.now())
      setLoading(false)
    }

    load()
    const id = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
    // Re-run when the set of symbols changes or a manual refresh is requested.
  }, [symbols.join(','), tick])

  return {
    quotes,
    lastUpdated,
    loading,
    refresh: () => setTick((t) => t + 1),
  }
}
