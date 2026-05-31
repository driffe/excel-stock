import { useEffect, useRef, useState } from 'react'
import { getNewsProvider } from '../api'
import { INDEX_SEEDS } from '../data/indices'
import type { IndexQuote, Lang, NewsItem } from '../types'

// News changes slowly and each company-news symbol is a separate request, so poll
// news on a slower cadence than quotes (≥60s) to stay under Finnhub's free-tier cap.
const NEWS_REFRESH_MS = Math.max(60000, Number(import.meta.env.VITE_REFRESH_MS ?? 15000))
// Real index values (Stooq via /api/indices) refresh on this cadence.
const INDEX_REFRESH_MS = 30000

export interface UseNewsResult {
  news: NewsItem[]
  indices: IndexQuote[]
  loading: boolean
  /** True when both news requests failed (e.g. proxy down / rate-limited). */
  error: boolean
  refresh: () => void
}

/**
 * Polls the active news provider for market + company news (for the given sheet's
 * symbols), and the real index strip (S&P/Nasdaq/Dow) from /api/indices.
 */
export function useNews(symbols: string[], lang: Lang): UseNewsResult {
  const [news, setNews] = useState<NewsItem[]>([])
  const [indices, setIndices] = useState<IndexQuote[]>(() => INDEX_SEEDS.map((i) => ({ ...i })))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  const symbolsRef = useRef(symbols)
  symbolsRef.current = symbols
  const symbolsKey = symbols.join(',')

  useEffect(() => {
    const provider = getNewsProvider()
    let cancelled = false

    async function load() {
      setLoading(true)
      const current = symbolsRef.current.filter((s) => s.trim() !== '')
      const [marketR, companyR] = await Promise.allSettled([
        provider.getMarketNews(lang),
        current.length ? provider.getCompanyNews(current, lang) : Promise.resolve([] as NewsItem[]),
      ])
      if (cancelled) return
      const market = marketR.status === 'fulfilled' ? marketR.value : []
      const company = companyR.status === 'fulfilled' ? companyR.value : []
      setError(marketR.status === 'rejected' && companyR.status === 'rejected')

      // Company news for the active sheet first, then general market news; dedupe
      // by url (then id) so the same article from two providers can't appear twice.
      const seen = new Set<string>()
      const merged: NewsItem[] = []
      for (const item of [...company, ...market]) {
        const dedupeKey = (item.url || item.id).toLowerCase()
        if (seen.has(dedupeKey)) continue
        seen.add(dedupeKey)
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
  }, [symbolsKey, lang, tick])

  // Real index values from /api/indices (Stooq, server-side). Keep prior/seed values on error.
  useEffect(() => {
    let cancelled = false
    async function loadIndices() {
      try {
        const res = await fetch('/api/indices')
        if (!res.ok) return
        const data = (await res.json()) as IndexQuote[]
        if (!cancelled && Array.isArray(data) && data.length) setIndices(data)
      } catch {
        /* keep current values */
      }
    }
    loadIndices()
    const id = setInterval(loadIndices, INDEX_REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return {
    news,
    indices,
    loading,
    error,
    refresh: () => setTick((t) => t + 1),
  }
}
