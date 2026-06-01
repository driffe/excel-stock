/**
 * Default watchlist sheets. A sheet's `symbols` array is the source of truth for
 * what's tracked; live quotes are merged in for display (see App.tsx).
 *
 * `id` is a stable internal key used to look up a localized default name
 * (i18n key `sheet.<id>`). `name` is non-null only after the user renames a tab.
 */
export interface Sheet {
  id: string
  /** User-chosen name; null means "use the localized default for `id`". */
  name: string | null
  symbols: string[]
}

export const DEFAULT_SHEETS: Sheet[] = [
  {
    // NASDAQ top 10 by market cap.
    id: 'nasdaq',
    name: null,
    symbols: ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'AVGO', 'TSLA', 'NFLX', 'COST'],
  },
  {
    // NYSE top 10 by market cap.
    id: 'nyse',
    name: null,
    symbols: ['BRK.B', 'LLY', 'JPM', 'WMT', 'V', 'ORCL', 'MA', 'XOM', 'JNJ', 'UNH'],
  },
  {
    id: 'etf',
    name: null,
    symbols: ['SPY', 'QQQ', 'VOO', 'VTI', 'IWM', 'DIA', 'GLD', 'SCHD', 'ARKK', 'XLF', 'SOXX', 'IGV', 'KWEB', 'EWY', 'IBIT'],
  },
  {
    id: 'holdings',
    name: null,
    symbols: ['AAPL', 'NVDA', 'MSFT', 'GOOGL'],
  },
]

/** The virtual favorites sheet id (built from starred symbols, never stored in `sheets`). */
export const FAV_SHEET_ID = '__fav__'
