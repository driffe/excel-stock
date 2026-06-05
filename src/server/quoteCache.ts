// Server-side quote cache + request coalescing. Collapses duplicate/rapid quote
// requests (React StrictMode's double mount, overlapping polls) into a single
// upstream Finnhub call, and serves a short TTL cache — which is what keeps live
// mode under Finnhub's free-tier rate limit. Module state persists across requests
// in a warm process (Vite dev server; warm Vercel function instance).
import { buildServerQuoteProvider } from './providers.js'
import { getStooqQuoteCached, SHARED_SYMBOLS } from './stooqQuotes.js'
import { getStooqNameCached } from './stooqNames.js'
import { SYMBOL_NAMES } from '../api/names.js'
import type { QuoteProvider } from '../api/provider.js'
import type { Quote } from '../types.js'

type Env = Record<string, string | undefined>

const TTL_MS = 12_000
const MAX_ENTRIES = 1000
const cache = new Map<string, { at: number; quote: Quote }>()
const inflight = new Map<string, Promise<Quote>>()

let provider: QuoteProvider | null = null
function getProvider(env: Env): QuoteProvider {
  return (provider ??= buildServerQuoteProvider(env))
}

export async function getQuoteCached(env: Env, symbol: string): Promise<Quote> {
  const key = symbol.toUpperCase()

  // Shared default-watchlist symbols (the viral 95%) go through Stooq's keyless
  // batch, so quota stays constant under a spike regardless of viewer count. Only
  // fall through to the per-symbol Finnhub path if Stooq has no price for it.
  if (SHARED_SYMBOLS.has(key)) {
    const stooq = await getStooqQuoteCached(key).catch(() => null)
    if (stooq && stooq.price != null) return stooq
  }

  const now = Date.now()

  const hit = cache.get(key)
  if (hit && now - hit.at < TTL_MS) return hit.quote

  const pending = inflight.get(key)
  if (pending) return pending

  const promise = getProvider(env)
    .getQuote(key)
    .then(async (quote) => {
      // Symbols on this path aren't in the default watchlist, so they're typically
      // user-added. Fill a display name from Stooq (keyless) for any not in the
      // curated map — the client falls back to this when lookupName() is empty.
      // Provider-agnostic: works whether the quote came from Finnhub or the dev mock.
      if (!SYMBOL_NAMES[key]) {
        const name = await getStooqNameCached(key).catch(() => null)
        if (name) quote.name = name
      }
      if (cache.size > MAX_ENTRIES) cache.clear()
      cache.set(key, { at: Date.now(), quote })
      inflight.delete(key)
      return quote
    })
    .catch((err) => {
      inflight.delete(key)
      // On an upstream error (e.g. a transient 429), serve a stale value if we have one.
      const stale = cache.get(key)
      if (stale) return stale.quote
      throw err
    })

  inflight.set(key, promise)
  return promise
}
