import type { NewsProvider } from './news'
import type { NewsItem } from '../types'
import { resolveNewsSources } from './resolveSource'
import { relatedSymbols } from './tickerMatch'
// note: company-news `related` is re-derived from actual headline/summary mentions

interface FinnhubNews {
  category: string
  datetime: number // unix seconds
  headline: string
  id: number
  image: string
  related: string
  source: string
  summary: string
  url: string
}

function normalize(n: FinnhubNews): NewsItem {
  return {
    id: String(n.id),
    headline: n.headline,
    summary: n.summary,
    source: n.source,
    url: n.url,
    datetime: n.datetime ? n.datetime * 1000 : Date.now(),
    related: (n.related || '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
    category: n.category || 'general',
  }
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Live news from finnhub.io. Reuses VITE_FINNHUB_API_KEY.
 * Live headlines are English; KO mode keeps them as-is (no live translation).
 */
export class FinnhubNewsProvider implements NewsProvider {
  readonly name = 'finnhub'

  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error('FinnhubNewsProvider requires an API key (server-side FINNHUB_API_KEY).')
    }
  }

  async getMarketNews(): Promise<NewsItem[]> {
    const url = `https://finnhub.io/api/v1/news?category=general&token=${this.apiKey}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Finnhub market-news error ${res.status}`)
    const arr = (await res.json()) as FinnhubNews[]
    return resolveNewsSources(arr.slice(0, 30).map(normalize))
  }

  async getCompanyNews(symbols: string[]): Promise<NewsItem[]> {
    const to = new Date()
    const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fromStr = ymd(from)
    const toStr = ymd(to)

    // Cap the per-symbol fan-out: each symbol is a separate request, so keeping
    // this small is what keeps live mode under Finnhub's free-tier rate limit.
    const results = await Promise.allSettled(
      symbols.slice(0, 4).map(async (sym) => {
        const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(
          sym.toUpperCase(),
        )}&from=${fromStr}&to=${toStr}&token=${this.apiKey}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Finnhub company-news error ${res.status} for ${sym}`)
        const arr = (await res.json()) as FinnhubNews[]
        return arr.slice(0, 4).map(normalize)
      }),
    )

    const seen = new Set<string>()
    const merged: NewsItem[] = []
    for (const r of results) {
      if (r.status !== 'fulfilled') continue
      for (const item of r.value) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        merged.push(item)
      }
    }

    // Re-tag from actual mentions: Finnhub returns loosely-related articles under a
    // symbol's company-news, so trust the headline/summary, not the queried symbol.
    for (const item of merged) {
      item.related = relatedSymbols(`${item.headline} ${item.summary}`, symbols)
    }

    return resolveNewsSources(merged.sort((a, b) => b.datetime - a.datetime))
  }
}
