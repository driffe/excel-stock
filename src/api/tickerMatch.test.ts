import { describe, it, expect } from 'vitest'
import { relatedSymbols } from './tickerMatch'

const WATCH = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'META', 'GOOGL', 'BRK.B', 'V']

describe('relatedSymbols', () => {
  it('matches by company name', () => {
    expect(relatedSymbols("Apple's next AI test may not be Siri", WATCH)).toEqual(['AAPL'])
    expect(relatedSymbols('Tesla begins weighing a spinoff', WATCH)).toEqual(['TSLA'])
  })

  it('matches by ticker (>= 3 chars)', () => {
    expect(relatedSymbols('NVDA jumps on datacenter demand', WATCH)).toContain('NVDA')
  })

  it('matches common-name aliases (Google / Facebook)', () => {
    expect(relatedSymbols('Google unveils a new model', WATCH)).toEqual(['GOOGL'])
    expect(relatedSymbols('Facebook parent reports earnings', WATCH)).toEqual(['META'])
  })

  it('returns [] when no watchlist symbol is actually mentioned', () => {
    expect(relatedSymbols('Datadog doubles as investors recognize a market', WATCH)).toEqual([])
    expect(relatedSymbols('Warren Buffett successor made big purchases', WATCH)).toEqual([])
  })

  it('does not substring-match (whitespace-bounded)', () => {
    expect(relatedSymbols('Social media trends keep climbing', WATCH)).toEqual([])
  })

  it('BRK.B matches via the Berkshire name, not the dotted ticker', () => {
    expect(relatedSymbols('Berkshire Hathaway raises its stake', WATCH)).toEqual(['BRK.B'])
    expect(relatedSymbols('a brk.b regulatory filing', WATCH)).toEqual([])
  })

  it('can tag multiple symbols', () => {
    expect(relatedSymbols('Tesla and Meta both rally on AI news', WATCH)).toEqual(['TSLA', 'META'])
  })
})
