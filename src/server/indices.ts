// Real index values for the news-pane strip (S&P 500 / Nasdaq Composite / Dow),
// fetched server-side from CNBC's keyless batch quote endpoint (see cnbc.ts). One
// request covers all three; results are TTL-cached.
//
// `changePct` is now quoted vs. the PREVIOUS CLOSE (the upstream exposes it),
// matching every finance site. The previous Stooq-backed implementation could only
// compute an intraday close-vs-open move, so the strip disagreed with Yahoo/Google
// on gap days.
//
// Never throws. The former implementation let an upstream failure propagate, so
// when Stooq's endpoint was retired /api/indices returned 502 on ~100% of calls —
// the per-symbol INDEX_SEEDS fallback below only ran AFTER a successful HTTP
// response, which is precisely the case that had stopped happening. Degrading to
// the seeds keeps the strip populated and the function's error rate at zero.
import type { IndexQuote } from '../types.js'
import { INDEX_SEEDS } from '../data/indices.js'
import { fetchQuotes, INDEX_SYMBOLS } from './cnbc.js'

const TTL_MS = 30_000

// CNBC symbol (uppercase) → our index key. Inverted from the shared map in cnbc.ts
// so the two can never drift apart.
const SYMBOL_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(INDEX_SYMBOLS).map(([key, sym]) => [sym.toUpperCase(), key]),
)

let cache: { at: number; data: IndexQuote[] } | null = null
let inflight: Promise<IndexQuote[]> | null = null

async function fetchAll(): Promise<IndexQuote[]> {
  const quotes = await fetchQuotes(Object.values(INDEX_SYMBOLS))

  const byKey = new Map<string, IndexQuote>()
  for (const [sym, q] of quotes) {
    const key = SYMBOL_KEY[sym]
    if (key && q.price != null && q.price > 0) {
      byKey.set(key, { key, value: q.price, changePct: q.changePct ?? 0 })
    }
  }

  // Always return all three, falling back to the seed level for any that failed.
  return INDEX_SEEDS.map((seed) => byKey.get(seed.key) ?? { ...seed })
}

export async function getIndices(): Promise<IndexQuote[]> {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) return cache.data
  if (inflight) return inflight

  inflight = fetchAll()
    .then((data) => {
      cache = { at: Date.now(), data }
      inflight = null
      return data
    })
    .catch(() => {
      inflight = null
      // Serve the last good values if we have any, else the seeds. Deliberately
      // NOT cached: the next call retries the upstream instead of being pinned to
      // seed levels for a whole TTL window.
      return cache?.data ?? INDEX_SEEDS.map((seed) => ({ ...seed }))
    })
  return inflight
}
