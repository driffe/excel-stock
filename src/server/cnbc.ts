// Keyless batch market-data source: CNBC's public quote webservice.
//
// Replaces Stooq's /q/l/ light-quote CSV, which began returning 404 for EVERY
// symbol — indices and ordinary stocks alike, on both stooq.com and stooq.pl — and
// took /api/indices to a ~100% error rate with it. Of the free keyless sources
// probed, this is the only one that serves MANY symbols in ONE request and covers
// everything the three former Stooq call sites needed: index levels (.SPX/.IXIC/
// .DJI), OHLC, previous close, and the display name — the last of which used to
// require a separate request per symbol.
//
// Keeping the batch shape is the whole point: upstream load stays proportional to
// (tracked symbols / TTL) rather than to viewer count, which is what lets the
// shared default watchlist survive a spike across cold serverless instances and
// CDN PoPs that share no in-memory cache.
//
// Three constraints, each learned by probing the live endpoint:
//   1. The CDN in front of it 403s bot-looking User-Agents — `curl/8.x` is
//      rejected, a browser UA passes. Node's fetch sends its own UA, so one MUST
//      be set explicitly or every request fails.
//   2. Symbols are separated by "|". A comma is parsed as a single symbol
//      ("AAPL,MSFT" returns one unknown row), not as a list.
//   3. Every number arrives as a display string ("7,489.72", "-7.35%", "+52.09").
//
// Like the Stooq CSV it replaces, this is an undocumented endpoint with no
// stability guarantee. Callers must degrade rather than throw — see indices.ts,
// batchQuotes.ts and nameLookup.ts, which all fall back rather than surface a 502.
import type { Quote } from '../types.js'

const ENDPOINT = 'https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol'

// Required: a bot-looking UA is rejected by the edge (see note 1 above).
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// 35 symbols come back in ~380ms in one call; chunk defensively above that.
const MAX_PER_CALL = 50

/** CNBC index symbols for the news-pane strip, keyed by our stable index key. */
export const INDEX_SYMBOLS: Record<string, string> = {
  sp500: '.SPX',
  nasdaq: '.IXIC',
  dow: '.DJI',
}

interface RawQuote {
  symbol?: string
  name?: string
  /** 0 = resolved. Unknown symbols come back as 1 with null price/name. */
  code?: number | string
  last?: string
  open?: string
  high?: string
  low?: string
  previous_day_closing?: string
  change?: string
  change_pct?: string
}

/** "7,489.72" → 7489.72 · "-7.35%" → -7.35 · "+52.09" → 52.09 · "UNCH"/"" → null */
function num(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  if (typeof raw !== 'string') return null
  const n = parseFloat(raw.replace(/[,%\s+]/g, ''))
  return Number.isFinite(n) ? n : null
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function fetchGroup(symbols: string[]): Promise<RawQuote[]> {
  const url =
    `${ENDPOINT}?symbols=${symbols.join('|')}` +
    '&requestMethod=itv&noform=1&partnerId=2&fund=1&exthrs=1&output=json'
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } })
  if (!res.ok) throw new Error(`cnbc ${res.status}`)
  const body = (await res.json()) as {
    FormattedQuoteResult?: { FormattedQuote?: RawQuote | RawQuote[] }
  }
  // A single-symbol query may return an object rather than a one-element array.
  const q = body.FormattedQuoteResult?.FormattedQuote
  return Array.isArray(q) ? q : q ? [q] : []
}

/**
 * One batched fetch (chunked). Returns UPPERCASE symbol → Quote with `name`
 * filled. Symbols the upstream can't resolve are simply absent from the map.
 *
 * Rejects if a chunk request fails; every caller wraps this and degrades.
 */
export async function fetchQuotes(symbols: string[]): Promise<Map<string, Quote>> {
  const wanted = [...new Set(symbols.map((s) => s.toUpperCase()))].filter(Boolean)
  const out = new Map<string, Quote>()
  const at = Date.now()

  await Promise.all(
    chunk(wanted, MAX_PER_CALL).map(async (group) => {
      for (const raw of await fetchGroup(group)) {
        const sym = (raw.symbol ?? '').toUpperCase()
        if (!sym || Number(raw.code) !== 0) continue

        const price = num(raw.last)
        const prevClose = num(raw.previous_day_closing)
        // Prefer the upstream's own change fields; they are quoted against the
        // PREVIOUS CLOSE — the same basis as Finnhub and every finance site — so
        // batch-sourced rows and Finnhub-sourced rows stay consistent in one grid.
        const change =
          num(raw.change) ?? (price != null && prevClose != null ? price - prevClose : null)
        const changePct =
          num(raw.change_pct) ??
          (price != null && prevClose != null && prevClose > 0
            ? ((price - prevClose) / prevClose) * 100
            : null)

        out.set(sym, {
          symbol: sym,
          price,
          change,
          changePct,
          high: num(raw.high),
          low: num(raw.low),
          open: num(raw.open),
          prevClose,
          updatedAt: at,
          name: raw.name?.trim() || null,
        })
      }
    }),
  )

  return out
}
