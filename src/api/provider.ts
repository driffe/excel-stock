import type { Quote } from '../types'

/**
 * A quote provider fetches the latest quote for a single ticker symbol.
 * Implementations live alongside this file (mock.ts, finnhub.ts) and are
 * selected at startup by getProvider() based on Vite env vars.
 */
export interface QuoteProvider {
  readonly name: string
  getQuote(symbol: string): Promise<Quote>
}
