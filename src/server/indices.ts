// Real index values for the news-pane strip (S&P 500 / Nasdaq Composite / Dow),
// fetched server-side from Stooq's keyless light-quote CSV. Stooq tolerates
// datacenter IPs (unlike Yahoo, which 429s from Vercel). One request covers all
// three; results are TTL-cached. `changePct` is the intraday move (close vs open)
// since the keyless endpoint doesn't expose the previous close. Falls back to the
// seed levels if Stooq is unavailable, so the strip always shows something.
import type { IndexQuote } from '../types'
import { INDEX_SEEDS } from '../data/indices'

const TTL_MS = 30_000
const STOOQ_URL = 'https://stooq.com/q/l/?s=^spx+^ndq+^dji&f=sohlc&h&e=csv'

// Stooq symbol (uppercased) → our index key.
const SYMBOL_KEY: Record<string, string> = {
  '^SPX': 'sp500',
  '^NDQ': 'nasdaq',
  '^DJI': 'dow',
}

let cache: { at: number; data: IndexQuote[] } | null = null
let inflight: Promise<IndexQuote[]> | null = null

async function fetchAll(): Promise<IndexQuote[]> {
  const res = await fetch(STOOQ_URL, { headers: { accept: 'text/csv' } })
  if (!res.ok) throw new Error(`stooq ${res.status}`)
  const text = await res.text()

  const byKey = new Map<string, IndexQuote>()
  for (const line of text.trim().split('\n').slice(1)) {
    // "^SPX,open,high,low,close"
    const [sym, open, , , close] = line.split(',')
    const key = SYMBOL_KEY[(sym ?? '').toUpperCase()]
    const o = parseFloat(open)
    const c = parseFloat(close)
    if (key && Number.isFinite(o) && Number.isFinite(c) && o > 0) {
      byKey.set(key, { key, value: c, changePct: ((c - o) / o) * 100 })
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
    .catch((err) => {
      inflight = null
      if (cache) return cache.data
      throw err
    })
  return inflight
}
