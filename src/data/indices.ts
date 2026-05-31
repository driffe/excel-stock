import type { IndexQuote } from '../types.js'

/**
 * Initial / fallback values for the news-pane indices strip (■ Major Indices).
 *
 * Real values are fetched from Stooq via /api/indices (see src/server/indices.ts);
 * these seeds are shown on first paint and if that fetch fails. `key` is localized
 * to a display name in the UI.
 */
export const INDEX_SEEDS: IndexQuote[] = [
  { key: 'sp500', value: 7580, changePct: 0.01 },
  { key: 'nasdaq', value: 26972, changePct: 0.04 },
  { key: 'dow', value: 51032, changePct: 0.51 },
]
