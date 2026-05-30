import { useEffect, useRef, useState } from 'react'
import { getNewsProvider } from '../api'
import { INDEX_SEEDS } from '../data/indices'
import type { IndexQuote, Lang, NewsItem } from '../types'

// News changes slowly and each company-news symbol is a separate request, so poll
// news on a slower cadence than quotes (≥60s) to stay under Finnhub's free-tier cap.
const NEWS_REFRESH_MS = Math.max(60000, Number(import.meta.env.VITE_REFRESH_MS ?? 15000))
// Cosmetic: keep the indices strip shimmering even when markets are closed.
const INDEX_TICK_MS = 2600

export interface UseNewsResult {
  news: NewsItem[]
  indices: IndexQuote[]
  loading: boolean
  refresh: () => void
}

/**
 * Polls the active news provider for market + company news (for the given sheet's
 * symbols) every VITE_REFRESH_MS, and nudges the cosmetic indices strip.
 */
export function useNews(symbols: string[], lang: Lang): UseNewsResult {
  const [news, setNews] = useState<NewsItem[]>([])
  const [indices, setIndices] = useState<IndexQuote[]>(() => INDEX_SEEDS.map((i) => ({ ...i })))
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)

  const symbolsRef = useRef(symbols)
  symbolsRef.current = symbols

  useEffect(() => {
    const provider = getNewsProvider()
    let cancelled = false

    async function load() {
      setLoading(true)
      const current = symbolsRef.current.filter((s) => s.trim() !== '')
      const [market, company] = await Promise.all([
        provider.getMarketNews(lang).catch(() => [] as NewsItem[]),
        current.length
          ? provider.getCompanyNews(current, lang).catch(() => [] as NewsItem[])
          : Promise.resolve([] as NewsItem[]),
      ])
      if (cancelled) return

      // Company news for the active sheet first, then general market news; dedupe.
      const seen = new Set<string>()
      const merged: NewsItem[] = []
      for (const item of [...company, ...market]) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        merged.push(item)
      }
      setNews(merged.slice(0, 24))
      setLoading(false)
    }

    load()
    const id = setInterval(load, NEWS_REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [symbols.join(','), lang, tick])

  // Subtle local drift on the indices strip (purely cosmetic — see data/indices.ts).
  useEffect(() => {
    const id = setInterval(() => {
      setIndices((prev) =>
        prev.map((x) => {
          const d = (Math.random() - 0.48) * 0.5
          return {
            ...x,
            value: x.value * (1 + d / 1000),
            changePct: Math.max(-5, Math.min(5, x.changePct + d / 6)),
          }
        }),
      )
    }, INDEX_TICK_MS)
    return () => clearInterval(id)
  }, [])

  return {
    news,
    indices,
    loading,
    refresh: () => setTick((t) => t + 1),
  }
}
