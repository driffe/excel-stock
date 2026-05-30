// Server-side provider assembly, shared by the Vercel functions (api/*.ts) and
// the Vite dev middleware. Reads keys from the given env (process.env) — NON-VITE_
// vars that never reach the client bundle (falls back to legacy VITE_ names so an
// existing local .env keeps working in dev). Pure code (no node-only APIs), so it
// type-checks under the app config and tree-shakes out of the client bundle since
// nothing client-reachable imports it.
import type { QuoteProvider } from '../api/provider'
import type { NewsProvider } from '../api/news'
import { MockProvider } from '../api/mock'
import { FinnhubProvider } from '../api/finnhub'
import { MockNewsProvider } from '../api/news'
import { FinnhubNewsProvider } from '../api/finnhubNews'
import { MarketauxNewsProvider } from '../api/marketauxNews'
import { NaverNewsProvider } from '../api/naverNews'
import { CompositeNewsProvider, type TaggedNewsProvider } from '../api/compositeNews'

type Env = Record<string, string | undefined>

function pick(env: Env, ...names: string[]): string {
  for (const n of names) {
    const v = env[n]
    if (v) return v
  }
  return ''
}

/** Live Finnhub quotes when a key is present, else the zero-config mock walk. */
export function buildServerQuoteProvider(env: Env): QuoteProvider {
  const key = pick(env, 'FINNHUB_API_KEY', 'VITE_FINNHUB_API_KEY')
  return key ? new FinnhubProvider(key) : new MockProvider()
}

/**
 * Composes every news source whose key(s) are set (deduped, newest-first,
 * language-aware). Naver runs in direct mode here — on the server there's no CORS
 * and the secret stays server-side. Falls back to bilingual mock news.
 */
export function buildServerNewsProvider(env: Env): NewsProvider {
  const tagged: TaggedNewsProvider[] = []

  const finnhub = pick(env, 'FINNHUB_API_KEY', 'VITE_FINNHUB_API_KEY')
  if (finnhub) tagged.push({ provider: new FinnhubNewsProvider(finnhub), affinity: 'en' })

  const marketaux = pick(env, 'MARKETAUX_API_TOKEN', 'VITE_MARKETAUX_API_TOKEN')
  if (marketaux) tagged.push({ provider: new MarketauxNewsProvider(marketaux), affinity: 'en' })

  const nid = pick(env, 'NAVER_CLIENT_ID')
  const nsec = pick(env, 'NAVER_CLIENT_SECRET')
  if (nid && nsec) {
    tagged.push({
      provider: new NaverNewsProvider({ clientId: nid, clientSecret: nsec }),
      affinity: 'ko',
    })
  }

  if (tagged.length === 0) return new MockNewsProvider()
  if (tagged.length === 1) return tagged[0].provider
  return new CompositeNewsProvider(tagged)
}
