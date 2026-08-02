import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchQuotes } from './cnbc'

/** Build a response in the upstream's shape (numbers arrive as display strings). */
function reply(quotes: unknown[]) {
  return {
    ok: true,
    json: async () => ({ FormattedQuoteResult: { FormattedQuote: quotes } }),
  } as unknown as Response
}

/** A fetch stub typed like the real thing, so `.mock.calls` stays inspectable. */
function stubFetch(impl: () => Response) {
  const spy = vi.fn<(url: string | URL | Request, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(impl()),
  )
  vi.stubGlobal('fetch', spy)
  return spy
}

const AAPL = {
  symbol: 'AAPL',
  name: 'Apple Inc',
  code: 0,
  last: '1,308.91',
  open: '1,304.81',
  high: '1,310.69',
  low: '1,300.00',
  previous_day_closing: '1,333.43',
  change: '-24.52',
  change_pct: '-1.84%',
}

afterEach(() => vi.unstubAllGlobals())

describe('fetchQuotes', () => {
  it('parses display strings (thousands separators, %, leading +) into numbers', async () => {
    stubFetch(() => reply([AAPL]))
    const q = (await fetchQuotes(['AAPL'])).get('AAPL')
    expect(q?.price).toBe(1308.91)
    expect(q?.open).toBe(1304.81)
    expect(q?.prevClose).toBe(1333.43)
    expect(q?.change).toBe(-24.52)
    expect(q?.changePct).toBeCloseTo(-1.84, 5)
    expect(q?.name).toBe('Apple Inc')
  })

  it('separates symbols with "|" — a comma is parsed upstream as ONE symbol', async () => {
    const spy = stubFetch(() => reply([AAPL]))
    await fetchQuotes(['AAPL', 'MSFT'])
    expect(String(spy.mock.calls[0][0])).toContain('symbols=AAPL|MSFT')
  })

  it('sets an explicit User-Agent — the upstream edge 403s bot-looking clients', async () => {
    const spy = stubFetch(() => reply([AAPL]))
    await fetchQuotes(['AAPL'])
    const headers = spy.mock.calls[0][1]?.headers as Record<string, string>
    expect(headers['user-agent']).toMatch(/Mozilla/)
  })

  it('drops unresolved symbols (code !== 0) instead of emitting empty rows', async () => {
    stubFetch(() => reply([AAPL, { symbol: 'ZZZZ', code: 1, last: null, name: null }]))
    const map = await fetchQuotes(['AAPL', 'ZZZZ'])
    expect(map.has('AAPL')).toBe(true)
    expect(map.has('ZZZZ')).toBe(false)
  })

  it('accepts a bare object when a single-symbol query returns one unwrapped row', async () => {
    stubFetch(
      () =>
        ({
          ok: true,
          json: async () => ({ FormattedQuoteResult: { FormattedQuote: AAPL } }),
        }) as unknown as Response,
    )
    expect((await fetchQuotes(['AAPL'])).get('AAPL')?.price).toBe(1308.91)
  })
})
