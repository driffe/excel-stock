import { describe, it, expect } from 'vitest'
import { mapPoolSettled } from './pool'

describe('mapPoolSettled', () => {
  it('returns results in input order', async () => {
    const r = await mapPoolSettled([1, 2, 3, 4], 2, async (n) => n * 2)
    expect(r.map((x) => (x.status === 'fulfilled' ? x.value : null))).toEqual([2, 4, 6, 8])
  })

  it('never exceeds the concurrency limit', async () => {
    let active = 0
    let max = 0
    await mapPoolSettled([1, 2, 3, 4, 5, 6, 7, 8], 3, async () => {
      active += 1
      max = Math.max(max, active)
      await new Promise((res) => setTimeout(res, 5))
      active -= 1
    })
    expect(max).toBeLessThanOrEqual(3)
  })

  it('captures rejections without throwing, keeping order', async () => {
    const r = await mapPoolSettled([1, 2, 3], 2, async (n) => {
      if (n === 2) throw new Error('boom')
      return n
    })
    expect(r[0].status).toBe('fulfilled')
    expect(r[1].status).toBe('rejected')
    expect(r[2].status).toBe('fulfilled')
  })

  it('handles an empty list', async () => {
    expect(await mapPoolSettled([], 4, async (n) => n)).toEqual([])
  })
})
