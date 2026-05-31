// Server-side news cache + request coalescing for /api/news, mirroring quoteCache.
// /api/news composes several upstreams on each call, so without this every hit
// fans out to Finnhub/Marketaux/Naver — the cheapest endpoint to abuse. A short
// TTL keyed by (type, lang, symbols) collapses repeated/overlapping polls.
import { buildServerNewsProvider } from './providers.js'
import type { NewsProvider } from '../api/news.js'
import type { Lang, NewsItem } from '../types.js'

type Env = Record<string, string | undefined>

const TTL_MS = 45_000
const MAX_ENTRIES = 200

const cache = new Map<string, { at: number; items: NewsItem[] }>()
const inflight = new Map<string, Promise<NewsItem[]>>()

let provider: NewsProvider | null = null
function getProvider(env: Env): NewsProvider {
  return (provider ??= buildServerNewsProvider(env))
}

export async function getNewsCached(
  env: Env,
  type: 'market' | 'company',
  lang: Lang,
  symbols: string[],
): Promise<NewsItem[]> {
  const key = `${type}|${lang}|${[...symbols].sort().join(',')}`
  const now = Date.now()

  const hit = cache.get(key)
  if (hit && now - hit.at < TTL_MS) return hit.items

  const pending = inflight.get(key)
  if (pending) return pending

  const p = getProvider(env)
  const promise = (type === 'company' ? p.getCompanyNews(symbols, lang) : p.getMarketNews(lang))
    .then((items) => {
      if (cache.size > MAX_ENTRIES) cache.clear()
      cache.set(key, { at: Date.now(), items })
      inflight.delete(key)
      return items
    })
    .catch((err) => {
      inflight.delete(key)
      const stale = cache.get(key)
      if (stale) return stale.items
      throw err
    })

  inflight.set(key, promise)
  return promise
}
