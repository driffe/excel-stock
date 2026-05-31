// Batched, keyless quote source for the shared default watchlist.
//
// The launch problem: a viral spike fans out across serverless instances and CDN
// PoPs, none of which share an in-memory cache, so every cold path hits the quote
// upstream. Finnhub's free tier (~60 req/min) dies exactly when the most people
// are watching. Stooq has no API-key quota and serves many symbols in ONE CSV
// request, so the upstream load becomes (distinct symbols / TTL) — bounded by the
// watchlist, not by viewer count. That's what makes the default view survive a
// spike regardless of cache topology.
//
// Trade-off vs. Finnhub: Stooq's light quote is delayed (~15 min). But it exposes
// the previous close (the `p` field), so `change`/`changePct` are measured vs.
// PREVIOUS CLOSE — the same basis as Finnhub and every finance site (Yahoo/Google).
// That keeps default rows (Stooq) and user-added rows (Finnhub) consistent in one
// grid, and avoids the vs-open sign flips that would make the demo look "wrong."
import type { Quote } from '../types.js'
import { DEFAULT_SHEETS } from '../data/sheets.js'

// Spike dial: override via the QUOTE_TTL_MS server env (read without pulling in
// node types — this module is server-only but type-checks under the app config).
const serverEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
  ?.env
const TTL_MS = Number(serverEnv?.QUOTE_TTL_MS) || 30_000
// Stooq tolerates long batches, but keep URLs sane and chunk defensively.
const MAX_PER_CALL = 50
const MAX_TRACKED = 500

// Stooq light-quote CSV: one row per symbol, "Symbol,Open,High,Low,Close,Prev"
// (`p` = previous close, which is what lets us compute a real vs-prev-close move).
const fieldUrl = (query: string) =>
  `https://stooq.com/q/l/?s=${query}&f=sohlcp&h&e=csv`

/** Our ticker (e.g. "BRK.B") → Stooq query symbol (e.g. "brk-b.us"). */
function toStooq(symbol: string): string {
  return symbol.toLowerCase().replace(/\./g, '-') + '.us'
}

function num(s: string | undefined): number | null {
  const n = parseFloat(s ?? '')
  return Number.isFinite(n) ? n : null
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** One batched fetch (chunked). Returns a map of UPPERCASE symbol → Quote. */
export async function quotesFromStooq(symbols: string[]): Promise<Map<string, Quote>> {
  const wanted = [...new Set(symbols.map((s) => s.toUpperCase()))].filter(Boolean)
  const out = new Map<string, Quote>()

  await Promise.all(
    chunk(wanted, MAX_PER_CALL).map(async (group) => {
      // Map the Stooq-returned symbol ("BRK-B.US") back to ours ("BRK.B").
      const back = new Map<string, string>()
      for (const sym of group) back.set(toStooq(sym), sym)

      const query = group.map(toStooq).join('+')
      const res = await fetch(fieldUrl(query), { headers: { accept: 'text/csv' } })
      if (!res.ok) throw new Error(`stooq ${res.status}`)
      const text = await res.text()

      for (const line of text.trim().split('\n').slice(1)) {
        const [rawSym, open, high, low, close, prev] = line.split(',')
        const sym = back.get((rawSym ?? '').toLowerCase())
        if (!sym) continue
        const c = num(close)
        const pc = num(prev)
        out.set(sym, {
          symbol: sym,
          price: c && c > 0 ? c : null,
          // vs. previous close — same basis as Finnhub and Yahoo/Google.
          change: c != null && pc != null ? c - pc : null,
          changePct: c != null && pc != null && pc > 0 ? ((c - pc) / pc) * 100 : null,
          high: num(high),
          low: num(low),
          open: num(open),
          prevClose: pc,
          updatedAt: Date.now(),
        })
      }
    }),
  )

  return out
}

// ── Cached accessor ────────────────────────────────────────────────────────
// Symbol-keyed TTL cache + a single in-flight refresh that coalesces a burst of
// concurrent single-symbol requests into ONE batched Stooq call. On upstream
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
 * Stooq's keyless batch. Quote routing (quoteCache.ts) sends these here and keeps
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
      const fresh = await quotesFromStooq(stale)
      const at = Date.now()
      for (const [sym, quote] of fresh) cache.set(sym, { at, quote })
    } finally {
      inflight = null
    }
  })()
  return inflight
}

/** Batched cached read. Missing symbols (Stooq had no row) are simply absent. */
export async function getStooqQuotesCached(symbols: string[]): Promise<Map<string, Quote>> {
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

/** Single-symbol cached read; null if Stooq doesn't cover the symbol. */
export async function getStooqQuoteCached(symbol: string): Promise<Quote | null> {
  const map = await getStooqQuotesCached([symbol])
  return map.get(symbol.toUpperCase()) ?? null
}
