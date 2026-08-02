// Keyless display-name lookup for user-added tickers that aren't in the curated
// SYMBOL_NAMES map. Company/ETF names are effectively static, so results are
// cached for a day and keyed per symbol.
//
// Two tiers, so one dead upstream can't silently blank every name — which is
// exactly what happened when the previous single source (Stooq's /q/l/?f=sn CSV)
// was retired:
//
//   1. The keyless batch quote feed (cnbc.ts), which returns `name` alongside the
//      price. Same source as the quotes, so anything that prices also names.
//   2. SEC's company_tickers.json — the authoritative US-listed ticker→name map,
//      free and keyless, fetched at most once a day and held in memory.
//
// The SEC tier is OPT-IN via the SEC_USER_AGENT server env. SEC 403s any request
// whose User-Agent carries no contact address, and hard-coding a personal email
// into a public repo isn't acceptable — so when the var is unset we skip tier 2
// rather than ship a fake address. Set it to e.g. "excel-stock/1.0 (you@mail.com)".
import { fetchQuotes } from './cnbc.js'

const TTL_MS = 24 * 60 * 60 * 1000 // names don't change intraday
const MAX_ENTRIES = 1000
const SEC_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json'

const cache = new Map<string, { at: number; name: string | null }>()
const inflight = new Map<string, Promise<string | null>>()

const serverEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
  ?.env

/** SEC returns ALL-CAPS ("NVIDIA CORP") → "Nvidia Corp". */
function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
}

// ── Tier 2: SEC ticker→name map, loaded lazily and held for a day ──────────
let secMap: { at: number; byTicker: Map<string, string> } | null = null
let secInflight: Promise<Map<string, string>> | null = null

async function loadSecMap(): Promise<Map<string, string>> {
  const ua = serverEnv?.SEC_USER_AGENT ?? ''
  if (!ua) return new Map() // tier disabled — see the header note

  const res = await fetch(SEC_TICKERS_URL, {
    headers: { 'user-agent': ua, accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`sec ${res.status}`)

  // Shape: { "0": { cik_str, ticker, title }, "1": {...}, ... }
  const body = (await res.json()) as Record<string, { ticker?: string; title?: string }>
  const byTicker = new Map<string, string>()
  for (const row of Object.values(body)) {
    if (row?.ticker && row.title) byTicker.set(row.ticker.toUpperCase(), row.title)
  }
  return byTicker
}

async function secName(symbol: string): Promise<string | null> {
  const now = Date.now()
  if (!secMap || now - secMap.at >= TTL_MS) {
    // An empty map (tier disabled / upstream down) is cached too, so a miss costs
    // one attempt per day rather than one per symbol lookup.
    secInflight ??= loadSecMap()
      .then((byTicker) => {
        secMap = { at: Date.now(), byTicker }
        secInflight = null
        return byTicker
      })
      .catch(() => {
        secInflight = null
        secMap = { at: Date.now(), byTicker: secMap?.byTicker ?? new Map<string, string>() }
        return secMap.byTicker
      })
    await secInflight
  }
  const hit = secMap?.byTicker.get(symbol)
  return hit ? titleCase(hit) : null
}

// ── Resolution ─────────────────────────────────────────────────────────────

async function fetchName(symbol: string): Promise<string | null> {
  // Tier 1 — the batch quote feed already carries a properly-cased name.
  const quotes = await fetchQuotes([symbol]).catch(() => null)
  const name = quotes?.get(symbol)?.name?.trim()
  if (name) return name

  // Tier 2 — authoritative US-listed map, when enabled.
  return secName(symbol).catch(() => null)
}

/** Cached, coalesced name lookup. Returns null when no tier knows the symbol. */
export async function getNameCached(symbol: string): Promise<string | null> {
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
