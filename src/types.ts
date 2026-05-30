/** Supported UI languages. Default is English. */
export type Lang = 'en' | 'ko'

/** A single stock quote, normalized across providers. */
export interface Quote {
  symbol: string
  price: number | null
  /** Absolute change vs. previous close. */
  change: number | null
  /** Percent change vs. previous close. */
  changePct: number | null
  high: number | null
  low: number | null
  open: number | null
  prevClose: number | null
  /** Epoch ms of the last successful update, or null if never fetched. */
  updatedAt: number | null
}

/** One row in the spreadsheet. Quote fields are merged in for display. */
export interface StockRow extends Partial<Quote> {
  symbol: string
}

/** A normalized news item, shared across providers (Finnhub / mock). */
export interface NewsItem {
  id: string
  headline: string
  summary: string
  source: string
  url: string
  /** Epoch ms. */
  datetime: number
  /** Related tickers, uppercased. */
  related: string[]
  category: string
}

/** A market index quote for the news-pane indices strip. */
export interface IndexQuote {
  /** Stable key, localized to a display name in the UI (sp500 / nasdaq / dow). */
  key: string
  value: number
  changePct: number
}

export function emptyQuote(symbol: string): Quote {
  return {
    symbol,
    price: null,
    change: null,
    changePct: null,
    high: null,
    low: null,
    open: null,
    prevClose: null,
    updatedAt: null,
  }
}
