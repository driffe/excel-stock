import type { QuoteProvider } from './provider.js'
import type { Quote } from '../types.js'

/**
 * Offline provider: seeds each symbol at a deterministic price, then nudges it
 * with a small random walk on every fetch. Lets the app run with zero config.
 */
export class MockProvider implements QuoteProvider {
  readonly name = 'mock'
  private prices = new Map<string, number>()
  private prevClose = new Map<string, number>()

  private seed(symbol: string): number {
    // Deterministic starting price derived from the symbol's characters.
    let h = 0
    for (const ch of symbol) h = (h * 31 + ch.charCodeAt(0)) % 9973
    return 50 + (h % 450) // roughly $50–$500
  }

  async getQuote(symbol: string): Promise<Quote> {
    if (!this.prices.has(symbol)) {
      const start = this.seed(symbol)
      this.prices.set(symbol, start)
      this.prevClose.set(symbol, start)
    }

    const prev = this.prices.get(symbol)!
    // ±1.5% step.
    const next = Math.max(0.01, prev * (1 + (Math.random() - 0.5) * 0.03))
    this.prices.set(symbol, next)

    const prevClose = this.prevClose.get(symbol)!
    const change = next - prevClose
    const changePct = (change / prevClose) * 100

    const round = (n: number) => Math.round(n * 100) / 100
    return {
      symbol,
      price: round(next),
      change: round(change),
      changePct: round(changePct),
      high: round(Math.max(next, prev)),
      low: round(Math.min(next, prev)),
      open: round(prevClose),
      prevClose: round(prevClose),
      updatedAt: Date.now(),
    }
  }
}
