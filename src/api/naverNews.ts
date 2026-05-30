import type { NewsProvider } from './news'
import type { NewsItem } from '../types'
import { lookupName } from './names'

interface NaverItem {
  title: string
  originallink: string
  link: string
  description: string
  pubDate: string
}
interface NaverResponse {
  items: NaverItem[]
}

/** Strip Naver's <b> highlight tags and decode common HTML entities. */
function clean(s: string): string {
  return s
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function sourceFrom(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Naver'
  }
}

/**
 * Korean-language news via the Naver Search API. Used in KO mode.
 *
 * IMPORTANT: Naver's Open API is **server-side only** — it requires Client-Id /
 * Client-Secret headers and does NOT allow browser CORS (and the secret must not
 * ship in a frontend bundle). So this provider calls a small proxy you host
 * (VITE_NAVER_PROXY_URL) that forwards to Naver with the credentials attached.
 * Without a proxy URL it falls back to a direct call that will CORS-fail in the
 * browser — set up the proxy for this source to actually work.
 */
export class NaverNewsProvider implements NewsProvider {
  readonly name = 'naver'
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly proxyUrl?: string

  constructor(opts: { clientId?: string; clientSecret?: string; proxyUrl?: string }) {
    this.clientId = opts.clientId ?? ''
    this.clientSecret = opts.clientSecret ?? ''
    this.proxyUrl = opts.proxyUrl || undefined
    // Proxy mode needs no client-side creds; direct mode requires both (browser CORS aside).
    if (!this.proxyUrl && (!this.clientId || !this.clientSecret)) {
      throw new Error(
        'NaverNewsProvider needs VITE_NAVER_PROXY_URL (recommended) or client id + secret.',
      )
    }
  }

  private async search(query: string, related: string[]): Promise<NewsItem[]> {
    const params = `query=${encodeURIComponent(query)}&display=20&sort=date`
    let res: Response
    if (this.proxyUrl) {
      const sep = this.proxyUrl.includes('?') ? '&' : '?'
      res = await fetch(`${this.proxyUrl}${sep}${params}`)
    } else {
      // Direct call — will CORS-fail in a browser; documented above.
      res = await fetch(`https://openapi.naver.com/v1/search/news.json?${params}`, {
        headers: {
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret,
        },
      })
    }
    if (!res.ok) throw new Error(`Naver error ${res.status}`)
    const json = (await res.json()) as NaverResponse
    return (json.items ?? []).map((it) => ({
      id: it.link || it.originallink,
      headline: clean(it.title),
      summary: clean(it.description),
      source: sourceFrom(it.originallink || it.link),
      url: it.originallink || it.link,
      datetime: Date.parse(it.pubDate) || Date.now(),
      related,
      category: 'general',
    }))
  }

  getMarketNews(): Promise<NewsItem[]> {
    return this.search('증시', [])
  }

  async getCompanyNews(symbols: string[]): Promise<NewsItem[]> {
    const picks = symbols.slice(0, 3)
    if (!picks.length) return []
    const lists = await Promise.allSettled(
      picks.map((sym) => this.search(lookupName(sym, 'ko') || sym, [sym.toUpperCase()])),
    )
    return lists.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
  }
}
