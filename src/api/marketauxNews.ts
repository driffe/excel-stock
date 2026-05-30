import type { NewsProvider } from './news'
import type { NewsItem } from '../types'

interface MarketauxEntity {
  symbol: string
}
interface MarketauxArticle {
  uuid: string
  title: string
  description: string
  snippet: string
  url: string
  published_at: string
  source: string
  entities?: MarketauxEntity[]
}
interface MarketauxResponse {
  data: MarketauxArticle[]
}

function normalize(a: MarketauxArticle): NewsItem {
  return {
    id: a.uuid,
    headline: a.title,
    summary: a.description || a.snippet || '',
    source: a.source,
    url: a.url,
    datetime: Date.parse(a.published_at) || Date.now(),
    related: (a.entities ?? []).map((e) => e.symbol?.toUpperCase()).filter(Boolean),
    category: 'general',
  }
}

/**
 * Finance news from marketaux.com (English), with ticker-entity tagging.
 * Requires VITE_MARKETAUX_API_TOKEN.
 */
export class MarketauxNewsProvider implements NewsProvider {
  readonly name = 'marketaux'

  constructor(private readonly token: string) {
    if (!token) throw new Error('MarketauxNewsProvider requires VITE_MARKETAUX_API_TOKEN.')
  }

  private async fetchNews(params: Record<string, string>): Promise<NewsItem[]> {
    const qs = new URLSearchParams({
      api_token: this.token,
      language: 'en',
      filter_entities: 'true',
      limit: '20',
      ...params,
    })
    const res = await fetch(`https://api.marketaux.com/v1/news/all?${qs}`)
    if (!res.ok) throw new Error(`Marketaux error ${res.status}`)
    const json = (await res.json()) as MarketauxResponse
    return (json.data ?? []).map(normalize)
  }

  getMarketNews(): Promise<NewsItem[]> {
    return this.fetchNews({})
  }

  getCompanyNews(symbols: string[]): Promise<NewsItem[]> {
    if (!symbols.length) return Promise.resolve([])
    return this.fetchNews({ symbols: symbols.slice(0, 10).map((s) => s.toUpperCase()).join(',') })
  }
}
