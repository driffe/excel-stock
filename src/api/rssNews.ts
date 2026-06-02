import type { NewsProvider } from './news.js'
import type { NewsItem } from '../types.js'
import { lookupName } from './names.js'
import { relatedSymbols } from './tickerMatch.js'

/**
 * Keyless English news via **Google News RSS** — the news analogue of the keyless
 * Stooq quote source. No API key, no daily quota: upstream load is just
 * (distinct queries ÷ poll cadence), independent of viewer count, so it can't
 * "run out" mid-spike the way a metered source (Marketaux's 100/day) does.
 *
 * Server-side only (added in buildServerNewsProvider). Google News serves a clean
 * RSS 2.0 feed to datacenter requests where Yahoo's RSS 429s — same reason
 * indices.ts prefers Stooq over Yahoo. Market and company news both use the
 * `search` feed (the `topic/BUSINESS` headlines feed returns empty for server
 * requests, so it's avoided).
 *
 * Notes on the feed shape (verified against live output):
 *  - `<link>` is a `news.google.com/rss/articles/CBMi…` redirect that 302s to the
 *    real article — fine for a clickable headline. The real publisher is in the
 *    `<source url="…">Name</source>` element, and the `<title>` carries a
 *    " - Publisher" suffix we strip.
 *  - `<description>` is just the headline re-linked (no real snippet), so summary
 *    is intentionally left empty rather than echoing the headline.
 */

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const TIMEOUT_MS = 6000
const MARKET_QUERY = 'stock market'

/** Decode the handful of XML/HTML entities Google News emits in titles/sources. */
function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim()
}

/** First inner text of `<name …>…</name>` in an item block (attributes allowed). */
function tag(block: string, name: string): string {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(block)
  return m ? m[1] : ''
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * Parse a Google News RSS feed into NewsItem[] (related left empty — company news
 * re-tags it). Pure (no network) so it's unit-testable against a real fixture.
 */
export function parseRssFeed(xml: string): NewsItem[] {
  const out: NewsItem[] = []
  // Split on <item> and drop the channel preamble (its <title> is "Google News").
  for (const chunk of xml.split('<item>').slice(1)) {
    const block = chunk.split('</item>')[0]
    const link = decode(tag(block, 'link'))
    if (!link) continue

    let headline = decode(tag(block, 'title'))
    let source = decode(tag(block, 'source'))

    // The title ends with " - Publisher". Prefer the <source> element; if it's
    // missing, recover the publisher from that suffix. Either way, strip it.
    const dash = headline.lastIndexOf(' - ')
    if (!source && dash > 0) source = headline.slice(dash + 3)
    if (source && headline.endsWith(` - ${source}`)) {
      headline = headline.slice(0, headline.length - source.length - 3).trimEnd()
    }
    if (!headline) continue

    out.push({
      id: decode(tag(block, 'guid')) || link,
      headline,
      // <description> is only the re-linked headline, so don't fabricate a summary.
      summary: '',
      source: source || hostOf(link) || 'Google News',
      url: link,
      datetime: Date.parse(tag(block, 'pubDate')) || Date.now(),
      related: [],
      category: 'general',
    })
  }
  return out
}

export class RssNewsProvider implements NewsProvider {
  readonly name = 'rss'

  private async fetchFeed(query: string): Promise<NewsItem[]> {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
      query,
    )}&hl=en-US&gl=US&ceid=US:en`
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA }, signal: ctrl.signal })
      if (!res.ok) throw new Error(`Google News RSS error ${res.status}`)
      return parseRssFeed(await res.text()).slice(0, 20)
    } finally {
      clearTimeout(timer)
    }
  }

  getMarketNews(): Promise<NewsItem[]> {
    return this.fetchFeed(MARKET_QUERY)
  }

  async getCompanyNews(symbols: string[]): Promise<NewsItem[]> {
    // Cap the per-symbol fan-out (one request each), like Finnhub/Naver.
    const picks = symbols.slice(0, 4)
    if (!picks.length) return []

    const lists = await Promise.allSettled(
      picks.map(async (sym) => {
        const items = (await this.fetchFeed(`"${lookupName(sym, 'en') || sym}" stock`)).slice(0, 6)
        // RSS has no native ticker tags — re-derive them from real mentions, the
        // same way finnhubNews does, so the Ticker column stays honest.
        for (const it of items) it.related = relatedSymbols(it.headline, symbols)
        return items
      }),
    )

    const seen = new Set<string>()
    const merged: NewsItem[] = []
    for (const r of lists) {
      if (r.status !== 'fulfilled') continue
      for (const it of r.value) {
        if (seen.has(it.url)) continue
        seen.add(it.url)
        merged.push(it)
      }
    }
    return merged.sort((a, b) => b.datetime - a.datetime)
  }
}
