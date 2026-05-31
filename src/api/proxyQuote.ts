import type { QuoteProvider } from './provider.js'
import type { Quote } from '../types.js'

/**
 * Client quote provider for live mode. Calls the same-origin `/api/quote` proxy
 * (Vite dev middleware locally; Vercel function in prod) so the Finnhub key stays
 * server-side and never ships in the bundle. Returns an already-normalized Quote.
 */
export class ProxyQuoteProvider implements QuoteProvider {
  readonly name = 'proxy'

  async getQuote(symbol: string): Promise<Quote> {
    const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`)
    if (!res.ok) throw new Error(`quote proxy ${res.status} for ${symbol}`)
    return (await res.json()) as Quote
  }
}
