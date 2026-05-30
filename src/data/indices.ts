import type { IndexQuote } from '../types'

/**
 * Indices strip seeds for the news pane (■ Major Indices).
 *
 * Finnhub's free tier can't quote indices (^GSPC etc.), and ETF proxies (SPY≈$598)
 * would display 10×-off magnitudes that break the disguise. So the strip is seeded
 * at realistic index levels and nudged with a subtle local drift (see useNews) —
 * it's purely cosmetic chrome. `key` is localized to a display name in the UI.
 */
export const INDEX_SEEDS: IndexQuote[] = [
  { key: 'sp500', value: 5998.4, changePct: 0.42 },
  { key: 'nasdaq', value: 19421.3, changePct: 0.61 },
  { key: 'dow', value: 44520.18, changePct: 0.18 },
]
