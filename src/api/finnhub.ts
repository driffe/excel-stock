import type { QuoteProvider } from './provider.js'
import type { Quote } from '../types.js'

interface FinnhubQuote {
  c: number // current price
  d: number | null // change
  dp: number | null // percent change
  h: number // high
  l: number // low
  o: number // open
  pc: number // previous close
  t: number // unix timestamp (seconds)
}

/** Live quotes from finnhub.io. Requires VITE_FINNHUB_API_KEY. */
export class FinnhubProvider implements QuoteProvider {
  readonly name = 'finnhub'

  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error('FinnhubProvider requires an API key (server-side FINNHUB_API_KEY).')
    }
  }

  async getQuote(symbol: string): Promise<Quote> {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(
      symbol,
    )}&token=${this.apiKey}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Finnhub error ${res.status} for ${symbol}`)
    }
    const q = (await res.json()) as FinnhubQuote
    return {
      symbol,
      price: q.c || null,
      change: q.d,
      changePct: q.dp,
      high: q.h || null,
      low: q.l || null,
      open: q.o || null,
      prevClose: q.pc || null,
      updatedAt: q.t ? q.t * 1000 : Date.now(),
    }
  }
}
