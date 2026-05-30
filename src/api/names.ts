import type { Lang } from '../types'

/**
 * Symbol → bilingual display name. The 종목명 (Ticker name) column is editable,
 * but when left blank it falls back to this map for the active language.
 */
export const SYMBOL_NAMES: Record<string, { en: string; ko: string }> = {
  // Top 10
  NVDA: { en: 'NVIDIA Corp', ko: '엔비디아' },
  AAPL: { en: 'Apple Inc', ko: '애플' },
  MSFT: { en: 'Microsoft Corp', ko: '마이크로소프트' },
  AMZN: { en: 'Amazon.com Inc', ko: '아마존' },
  GOOGL: { en: 'Alphabet Inc', ko: '알파벳' },
  META: { en: 'Meta Platforms', ko: '메타' },
  TSLA: { en: 'Tesla Inc', ko: '테슬라' },
  AVGO: { en: 'Broadcom Inc', ko: '브로드컴' },
  JPM: { en: 'JPMorgan Chase', ko: 'JP모건' },
  V: { en: 'Visa Inc', ko: '비자' },
  NFLX: { en: 'Netflix Inc', ko: '넷플릭스' },
  // ETF
  SPY: { en: 'SPDR S&P 500', ko: 'SPDR S&P 500' },
  QQQ: { en: 'Invesco QQQ Trust', ko: '인베스코 QQQ' },
  VOO: { en: 'Vanguard S&P 500', ko: '뱅가드 S&P 500' },
  VTI: { en: 'Vanguard Total Mkt', ko: '뱅가드 토탈마켓' },
  IWM: { en: 'iShares Russell 2000', ko: '아이셰어스 러셀2000' },
  DIA: { en: 'SPDR Dow Jones', ko: 'SPDR 다우존스' },
  GLD: { en: 'SPDR Gold Shares', ko: 'SPDR 골드' },
  SCHD: { en: 'Schwab US Dividend', ko: '슈왑 미국배당' },
  ARKK: { en: 'ARK Innovation ETF', ko: 'ARK 이노베이션' },
  XLF: { en: 'Financial Select', ko: '금융 셀렉트' },
}

/** Returns the localized display name for a symbol, or '' when unknown. */
export function lookupName(symbol: string, lang: Lang): string {
  const entry = SYMBOL_NAMES[symbol.toUpperCase()]
  return entry ? entry[lang] : ''
}
