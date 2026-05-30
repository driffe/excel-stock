import type { QuoteProvider } from './provider'
import type { NewsProvider } from './news'
import { MockProvider } from './mock'
import { MockNewsProvider } from './news'
import { ProxyQuoteProvider } from './proxyQuote'
import { ProxyNewsProvider } from './proxyNews'

let cachedQuote: QuoteProvider | null = null
let cachedNews: NewsProvider | null = null

// Live mode routes all data through the same-origin /api proxy, so API keys live
// server-side and never ship in the client bundle. Mock mode is fully offline.
function isLive(): boolean {
  return (import.meta.env.VITE_QUOTE_PROVIDER ?? 'mock').toLowerCase() === 'finnhub'
}

/** The active quote provider — proxy (live) or mock. */
export function getProvider(): QuoteProvider {
  if (!cachedQuote) cachedQuote = isLive() ? new ProxyQuoteProvider() : new MockProvider()
  return cachedQuote
}

/** The active news provider — proxy (live, composed server-side) or mock. */
export function getNewsProvider(): NewsProvider {
  if (!cachedNews) cachedNews = isLive() ? new ProxyNewsProvider() : new MockNewsProvider()
  return cachedNews
}

export type { QuoteProvider }
export type { NewsProvider }
