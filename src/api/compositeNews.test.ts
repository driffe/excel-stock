import { describe, it, expect } from 'vitest'
import { CompositeNewsProvider, type LangAffinity } from './compositeNews'
import type { NewsProvider } from './news'
import type { NewsItem } from '../types'

function item(id: string, url: string, datetime: number): NewsItem {
  return { id, headline: id, summary: '', source: 's', url, datetime, related: [], category: 'general' }
}

function tagged(affinity: LangAffinity, items: NewsItem[]) {
  const provider: NewsProvider = {
    name: affinity,
    getMarketNews: async () => items,
    getCompanyNews: async () => items,
  }
  return { provider, affinity }
}

describe('CompositeNewsProvider', () => {
  it('dedupes by url and sorts newest-first', async () => {
    const a = item('a', 'http://x/1', 100)
    const b = item('b', 'http://x/2', 300)
    const dupOfA = item('c', 'http://x/1', 200) // same url as `a`, different id
    const comp = new CompositeNewsProvider([tagged('en', [a, b]), tagged('en', [dupOfA])])
    const res = await comp.getMarketNews('en')
    expect(res.map((r) => r.url)).toEqual(['http://x/2', 'http://x/1'])
  })

  it('uses only language-matching providers when present', async () => {
    const comp = new CompositeNewsProvider([
      tagged('en', [item('e', 'http://en/1', 100)]),
      tagged('ko', [item('k', 'http://ko/1', 100)]),
    ])
    expect((await comp.getMarketNews('ko')).map((r) => r.url)).toEqual(['http://ko/1'])
    expect((await comp.getMarketNews('en')).map((r) => r.url)).toEqual(['http://en/1'])
  })

  it('falls back to all providers when none match the language', async () => {
    const comp = new CompositeNewsProvider([tagged('en', [item('e', 'http://en/1', 100)])])
    expect((await comp.getMarketNews('ko')).map((r) => r.url)).toEqual(['http://en/1'])
  })

  it('survives a failing provider (settles, drops the failure)', async () => {
    const ok = tagged('en', [item('a', 'http://x/1', 100)])
    const bad = {
      provider: {
        name: 'bad',
        getMarketNews: async () => {
          throw new Error('down')
        },
        getCompanyNews: async () => [] as NewsItem[],
      } as NewsProvider,
      affinity: 'en' as LangAffinity,
    }
    const comp = new CompositeNewsProvider([ok, bad])
    expect((await comp.getMarketNews('en')).map((r) => r.url)).toEqual(['http://x/1'])
  })
})
