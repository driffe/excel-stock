// Keyless display-name lookup via Stooq's light-quote CSV (f=sn). Company/ETF
// names are effectively static, so this is cached long-term and keyed per symbol.
// Used to fill names for user-added tickers that aren't in the curated
// SYMBOL_NAMES map — keyless and provider-agnostic, the same spirit as the Stooq
// quote source (no API key, survives a spike).
const TTL_MS = 24 * 60 * 60 * 1000 // names don't change intraday
const MAX_ENTRIES = 1000

const cache = new Map<string, { at: number; name: string | null }>()
const inflight = new Map<string, Promise<string | null>>()

/** Our ticker (e.g. "BRK.B") → Stooq query symbol (e.g. "brk-b.us"). */
function toStooq(symbol: string): string {
  return symbol.toLowerCase().replace(/\./g, '-') + '.us'
}

/** Stooq returns ALL-CAPS ("ADVANCED MICRO DEVICES INC") → "Advanced Micro Devices Inc". */
function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
}

async function fetchName(symbol: string): Promise<string | null> {
  const query = toStooq(symbol)
  const res = await fetch(`https://stooq.com/q/l/?s=${query}&f=sn&h&e=csv`, {
    headers: { accept: 'text/csv' },
  })
  if (!res.ok) return null
  // "Symbol,Name\nAMD.US,ADVANCED MICRO DEVICES INC". Unknown symbols come back as
  // "N/D" or with the query echoed as the name ("ZZZZ.US,ZZZZ.US") — treat both as miss.
  const row = (await res.text()).trim().split('\n')[1] ?? ''
  const name = row.slice(row.indexOf(',') + 1).trim().replace(/^"|"$/g, '')
  if (!name || name.toUpperCase() === 'N/D' || name.toUpperCase() === query.toUpperCase()) {
    return null
  }
  return titleCase(name)
}

/** Cached, coalesced name lookup. Returns null when Stooq doesn't know the symbol. */
export async function getStooqNameCached(symbol: string): Promise<string | null> {
  const key = symbol.toUpperCase()
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.name

  const pending = inflight.get(key)
  if (pending) return pending

  const promise = fetchName(key)
    .then((name) => {
      if (cache.size > MAX_ENTRIES) cache.clear()
      cache.set(key, { at: Date.now(), name })
      inflight.delete(key)
      return name
    })
    .catch(() => {
      inflight.delete(key)
      return cache.get(key)?.name ?? null // serve stale on transient error
    })

  inflight.set(key, promise)
  return promise
}
