import type { NewsProvider } from './news.js'
import type { Lang, NewsItem } from '../types.js'

/**
 * Client news provider for live mode. Calls the same-origin `/api/news` proxy,
 * which composes every configured source server-side (keys stay server-side).
 */
export class ProxyNewsProvider implements NewsProvider {
  readonly name = 'proxy'

  private async get(
    type: 'market' | 'company',
    lang: Lang,
    symbols?: string[],
  ): Promise<NewsItem[]> {
    const qs = new URLSearchParams({ type, lang })
    if (symbols?.length) qs.set('symbols', symbols.join(','))
    const res = await fetch(`/api/news?${qs}`)
    if (!res.ok) throw new Error(`news proxy ${res.status}`)
    return (await res.json()) as NewsItem[]
  }

  getMarketNews(lang: Lang = 'en'): Promise<NewsItem[]> {
    return this.get('market', lang)
  }

  getCompanyNews(symbols: string[], lang: Lang = 'en'): Promise<NewsItem[]> {
    return this.get('company', lang, symbols)
  }
}
