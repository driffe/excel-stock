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
    const res = await fetch(item.url, {
      redirect: 'follow',
      headers: { 'user-agent': UA },
      signal: ctrl.signal,
    })
    res.body?.cancel?.() // we only need res.url — don't download the article body
    const finalHost = hostOf(res.url)
    if (finalHost && finalHost !== 'finnhub.io') {
      const source = cleanSource(finalHost)
      cache.set(item.url, { url: res.url, source })
      item.url = res.url
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
