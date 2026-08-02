// Batched, keyless quote source for the shared default watchlist.
//
// The launch problem: a viral spike fans out across serverless instances and CDN
// PoPs, none of which share an in-memory cache, so every cold path hits the quote
// upstream. Finnhub's free tier (~60 req/min) dies exactly when the most people
// are watching. The keyless batch source (cnbc.ts) has no API-key quota and serves
// many symbols in ONE request, so upstream load becomes (distinct symbols / TTL) —
// bounded by the watchlist, not by viewer count. That's what makes the default view
// survive a spike regardless of cache topology.
//
// Trade-off vs. Finnhub: the batch feed is delayed (~15 min). But it exposes the
// previous close, so `change`/`changePct` are measured vs. PREVIOUS CLOSE — the
// same basis as Finnhub and every finance site (Yahoo/Google). That keeps default
// rows and user-added rows consistent in one grid, and avoids the vs-open sign
// flips that would make the demo look "wrong."
//
// Previously backed by Stooq's /q/l/ CSV, which was retired and now 404s for every
// symbol. Only the fetch layer moved — the TTL cache and single-flight coalescing
// below are unchanged, and are what make the batch shape pay off.
import type { Quote } from '../types.js'
import { DEFAULT_SHEETS } from '../data/sheets.js'
import { fetchQuotes } from './cnbc.js'

// Spike dial: override via the QUOTE_TTL_MS server env (read without pulling in
// node types — this module is server-only but type-checks under the app config).
const serverEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
  ?.env
const TTL_MS = Number(serverEnv?.QUOTE_TTL_MS) || 30_000
const MAX_TRACKED = 500

// ── Cached accessor ────────────────────────────────────────────────────────
// Symbol-keyed TTL cache + a single in-flight refresh that coalesces a burst of
// concurrent single-symbol requests into ONE batched upstream call. On upstream
// failure we serve the last-known value (no blank cells) — same posture as
// quoteCache.ts and indices.ts.
//
// The refresh fetches the whole tracked UNIVERSE (not just the caller's symbol),
// seeded from the default watchlist. That's what makes coalescing correct: the
// client polls one /api/quote?symbol=X per symbol, so the server sees N concurrent
// single-symbol calls — the first triggers a full-universe batch, the rest await
// that same in-flight promise and read their value from the now-warm cache.

/**
 * The shared default-watchlist symbols (uppercase) — the spike-safe set routed to
 * the keyless batch. Quote routing (quoteCache.ts) sends these here and keeps
 * arbitrary user-added symbols on the real-time Finnhub path.
 */
export const SHARED_SYMBOLS: ReadonlySet<string> = new Set(
  DEFAULT_SHEETS.flatMap((s) => s.symbols).map((s) => s.toUpperCase()),
)

const cache = new Map<string, { at: number; quote: Quote }>()
// Seeded with the shared default symbols so the very first refresh batches them
// all together regardless of which one a request happens to ask for first.
const universe = new Set<string>(SHARED_SYMBOLS)
let inflight: Promise<void> | null = null

function isFresh(symbol: string, now: number): boolean {
  const hit = cache.get(symbol)
  return !!hit && now - hit.at < TTL_MS
}

/** Refresh every stale symbol across the whole universe in one coalesced batch. */
function refreshUniverse(): Promise<void> {
  if (inflight) return inflight
  const now = Date.now()
  const stale = [...universe].filter((s) => !isFresh(s, now))
  if (stale.length === 0) return Promise.resolve()

  inflight = (async () => {
    try {
      const fresh = await fetchQuotes(stale)
      const at = Date.now()
      for (const [sym, quote] of fresh) cache.set(sym, { at, quote })
    } finally {
      inflight = null
    }
  })()
  return inflight
}

/** Batched cached read. Symbols the upstream can't resolve are simply absent. */
export async function getBatchQuotesCached(symbols: string[]): Promise<Map<string, Quote>> {
  const upper = [...new Set(symbols.map((s) => s.toUpperCase()))].filter(Boolean)
  for (const s of upper) if (universe.size < MAX_TRACKED) universe.add(s)

  const now = Date.now()
  if (upper.some((s) => !isFresh(s, now))) {
    // On a refresh failure, fall through and serve whatever stale values we have.
    await refreshUniverse().catch(() => {})
  }
  const out = new Map<string, Quote>()
  for (const sym of upper) {
    const hit = cache.get(sym)
    if (hit) out.set(sym, hit.quote)
  }
  return out
}

/** Single-symbol cached read; null if the upstream doesn't cover the symbol. */
export async function getBatchQuoteCached(symbol: string): Promise<Quote | null> {
  const map = await getBatchQuotesCached([symbol])
  return map.get(symbol.toUpperCase()) ?? null
}
