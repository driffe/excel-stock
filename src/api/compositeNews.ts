import type { NewsProvider } from './news.js'
import type { Lang, NewsItem } from '../types.js'

/** A news source's language affinity: which UI language it's preferred for. */
export type LangAffinity = 'en' | 'ko' | 'any'

export interface TaggedNewsProvider {
  provider: NewsProvider
  affinity: LangAffinity
}

/** Merge news lists: dedupe by url (then id), drop empties, sort newest-first. */
function merge(lists: NewsItem[][]): NewsItem[] {
  const seen = new Set<string>()
  const out: NewsItem[] = []
  for (const list of lists) {
    for (const item of list) {
      const key = (item.url || item.id || '').toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      out.push(item)
    }
  }
  return out.sort((a, b) => b.datetime - a.datetime)
}

/**
 * Fans a request out to several news providers and merges the results.
 *
 * Per call it prefers providers whose affinity matches the active language
 * (KO → Naver, EN → Finnhub/Marketaux); if none match that language it falls
 * back to all configured providers, so e.g. KO mode with only English sources
 * still shows news (English bodies, per the project's i18n decision).
 */
export class CompositeNewsProvider implements NewsProvider {
  readonly name = 'composite'

  constructor(private readonly providers: TaggedNewsProvider[]) {}

  private pick(lang: Lang): NewsProvider[] {
    const matched = this.providers.filter((p) => p.affinity === lang || p.affinity === 'any')
    return (matched.length ? matched : this.providers).map((p) => p.provider)
  }

  async getMarketNews(lang: Lang = 'en'): Promise<NewsItem[]> {
    const results = await Promise.allSettled(this.pick(lang).map((p) => p.getMarketNews(lang)))
    return merge(results.map((r) => (r.status === 'fulfilled' ? r.value : [])))
  }

  async getCompanyNews(symbols: string[], lang: Lang = 'en'): Promise<NewsItem[]> {
    const results = await Promise.allSettled(
      this.pick(lang).map((p) => p.getCompanyNews(symbols, lang)),
    )
    return merge(results.map((r) => (r.status === 'fulfilled' ? r.value : [])))
  }
}
