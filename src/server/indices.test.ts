import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { INDEX_SEEDS } from '../data/indices'

// getIndices() holds a module-level TTL cache, so each case needs a fresh module.
async function freshGetIndices() {
  vi.resetModules()
  return (await import('./indices')).getIndices
}

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllGlobals())

describe('getIndices', () => {
  // Regression: the previous implementation let an upstream failure propagate, so
  // when the old source was retired /api/indices returned 502 on ~100% of calls.
  it('degrades to seed levels instead of throwing when the upstream fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 }) as unknown as Response))
    const getIndices = await freshGetIndices()

    const data = await getIndices()
    expect(data).toHaveLength(INDEX_SEEDS.length)
    expect(data.map((d) => d.key)).toEqual(INDEX_SEEDS.map((s) => s.key))
  })

  it('retries the upstream on the next call rather than caching the seed fallback', async () => {
    const spy = vi.fn(async () => ({ ok: false, status: 500 }) as unknown as Response)
    vi.stubGlobal('fetch', spy)
    const getIndices = await freshGetIndices()

    await getIndices()
    await getIndices()
    expect(spy.mock.calls.length).toBe(2)
  })

  it('maps upstream index symbols onto our stable keys', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          ({
            ok: true,
            json: async () => ({
              FormattedQuoteResult: {
                FormattedQuote: [
                  { symbol: '.SPX', code: 0, last: '7,489.72', change_pct: '+0.70%' },
                  { symbol: '.IXIC', code: 0, last: '25,373.85', change_pct: '+1.00%' },
                  { symbol: '.DJI', code: 0, last: '52,485.03', change_pct: '+0.53%' },
                ],
              },
            }),
          }) as unknown as Response,
      ),
    )
    const getIndices = await freshGetIndices()

    const byKey = Object.fromEntries((await getIndices()).map((d) => [d.key, d]))
    expect(byKey.sp500.value).toBe(7489.72)
    expect(byKey.nasdaq.value).toBe(25373.85)
    expect(byKey.dow.value).toBe(52485.03)
    expect(byKey.sp500.changePct).toBeCloseTo(0.7, 5)
  })

  it('falls back per-symbol when the upstream omits one index', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          ({
            ok: true,
            json: async () => ({
              FormattedQuoteResult: {
                FormattedQuote: [{ symbol: '.SPX', code: 0, last: '7,489.72', change_pct: '+0.70%' }],
              },
            }),
          }) as unknown as Response,
      ),
    )
    const getIndices = await freshGetIndices()

    const byKey = Object.fromEntries((await getIndices()).map((d) => [d.key, d]))
    expect(byKey.sp500.value).toBe(7489.72)
    const dowSeed = INDEX_SEEDS.find((s) => s.key === 'dow')!
    expect(byKey.dow.value).toBe(dowSeed.value)
  })
})
