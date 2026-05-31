import { mapPoolSettled } from '../lib/pool'
import type { NewsItem } from '../types'

/**
 * Finnhub's news `url` is a `finnhub.io/api/news?id=…` redirect and its `source`
 * is the generic aggregator (e.g. "Yahoo") rather than the real publisher — so a
 * Motley Fool article hosted on Yahoo shows up as source "Yahoo". This resolves
 * the redirect server-side to the real article URL and re-labels the source from
 * its actual domain. Runs only for finnhub.io links, with an id-keyed cache and a
 * concurrency cap so it stays cheap; failures keep the original values.
 */

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const CONCURRENCY = 5
const TIMEOUT_MS = 6000
const MAX_CACHE = 500

// finnhub redirect url → resolved { real url, clean source }. Stable per article.
const cache = new Map<string, { url: string; source: string }>()

const SOURCE_NAMES: Record<string, string> = {
  'fool.com': 'Motley Fool',
  'finance.yahoo.com': 'Yahoo Finance',
  'yahoo.com': 'Yahoo Finance',
  'cnbc.com': 'CNBC',
  'reuters.com': 'Reuters',
  'bloomberg.com': 'Bloomberg',
  'seekingalpha.com': 'Seeking Alpha',
  'marketwatch.com': 'MarketWatch',
  'investing.com': 'Investing.com',
  'investors.com': "Investor's Business Daily",
  'barrons.com': "Barron's",
  'businessinsider.com': 'Business Insider',
  'forbes.com': 'Forbes',
  'wsj.com': 'The Wall Street Journal',
  'thestreet.com': 'TheStreet',
  'zacks.com': 'Zacks',
  'benzinga.com': 'Benzinga',
  'insidermonkey.com': 'Insider Monkey',
  'fortune.com': 'Fortune',
  '247wallst.com': '24/7 Wall St.',
  'investorshub.advfn.com': 'InvestorsHub',
  'tipranks.com': 'TipRanks',
  'gurufocus.com': 'GuruFocus',
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function cleanSource(domain: string): string {
  if (SOURCE_NAMES[domain]) return SOURCE_NAMES[domain]
  const base = domain.split('.').slice(-2).join('.')
  return SOURCE_NAMES[base] ?? domain // the real domain is already more accurate than "Yahoo"
}

/** SSRF guard: only trust http(s) URLs on a public host (not finnhub, loopback, or private IPs). */
function isPublicHttpUrl(raw: string): boolean {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return false
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
  const host = u.hostname.toLowerCase()
  if (host === 'finnhub.io' || host.endsWith('.finnhub.io')) return false
  if (host === 'localhost' || host.endsWith('.localhost')) return false
  if (host === '::1' || host.startsWith('fe80') || host.startsWith('fc') || host.startsWith('fd')) {
    return false
  }
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/.exec(host)
  if (m) {
    const a = +m[1]
    const b = +m[2]
    // loopback / "this host" / private / link-local
    if (a === 0 || a === 127 || a === 10 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      return false
    }
  }
  return true
}

async function resolveOne(item: NewsItem): Promise<void> {
  if (hostOf(item.url) !== 'finnhub.io') return // only fix finnhub redirect links

  const cached = cache.get(item.url)
  if (cached) {
    item.url = cached.url
    item.source = cached.source
    return
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    // redirect: 'manual' — read the Location instead of following it, so we never
    // issue a request to the (Finnhub-feed-influenced) target host. Validate it's a
    // public host before trusting it, to block SSRF to internal/metadata addresses.
    const res = await fetch(item.url, {
      redirect: 'manual',
      headers: { 'user-agent': UA },
      signal: ctrl.signal,
    })
    res.body?.cancel?.()
    const loc = res.headers.get('location') ?? ''
    if (isPublicHttpUrl(loc)) {
      const source = cleanSource(hostOf(loc))
      if (cache.size > MAX_CACHE) cache.clear()
      cache.set(item.url, { url: loc, source })
      item.url = loc
      item.source = source
    }
  } catch {
    // keep original url/source on timeout or network error
  } finally {
    clearTimeout(timer)
  }
}

/** Resolve real article URLs + publishers for any finnhub.io redirect items (in place). */
export async function resolveNewsSources(items: NewsItem[]): Promise<NewsItem[]> {
  await mapPoolSettled(items, CONCURRENCY, resolveOne)
  return items
}
