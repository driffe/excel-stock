import { SYMBOL_NAMES } from './names'

/**
 * Decides which watchlist symbols a news article is actually about, by checking
 * whether the ticker or company name appears in the headline/summary. Finnhub's
 * company-news endpoint tags loosely-related articles with the queried symbol
 * (a Datadog piece comes back tagged "NVDA"); re-deriving tags from real mentions
 * keeps the Ticker column honest.
 */

// Common-name aliases where articles refer to a company differently from its
// formal name (e.g. "Google" for Alphabet, "Facebook" for Meta).
const NAME_ALIASES: Record<string, string[]> = {
  GOOGL: ['google', 'alphabet'],
  GOOG: ['google', 'alphabet'],
  META: ['meta', 'facebook'],
}

// Corporate-name noise words to drop when extracting a distinctive company word.
const SUFFIXES = new Set([
  'inc', 'corp', 'corporation', 'incorporated', 'co', 'company', 'ltd', 'limited',
  'plc', 'holdings', 'platforms', 'group', 'trust', 'etf', 'fund', 'technologies',
  'technology', 'sa', 'ag', 'nv', 'the', 'shares', 'index',
])

const termCache = new Map<string, string[]>()

/** Match terms for a symbol: the ticker (≥3 chars), aliases, and its first distinctive name word. */
function searchTerms(sym: string): string[] {
  const cached = termCache.get(sym)
  if (cached) return cached

  const terms = new Set<string>()
  if (sym.length >= 3) terms.add(sym.toLowerCase()) // short tickers like "V" are too ambiguous
  for (const a of NAME_ALIASES[sym] ?? []) terms.add(a)

  const entry = SYMBOL_NAMES[sym]
  if (entry) {
    const word = entry.en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .find((w) => w.length >= 3 && !SUFFIXES.has(w))
    if (word) terms.add(word) // e.g. "nvidia", "jpmorgan", "broadcom"
  }

  const list = [...terms]
  termCache.set(sym, list)
  return list
}

/** Which of `symbols` are actually named (by ticker or company name) in `text`. */
export function relatedSymbols(text: string, symbols: string[]): string[] {
  const tokens = ' ' + text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' '
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of symbols) {
    const sym = raw.toUpperCase()
    if (seen.has(sym)) continue
    if (searchTerms(sym).some((t) => tokens.includes(' ' + t + ' '))) {
      out.push(sym)
      seen.add(sym)
    }
  }
  return out
}
