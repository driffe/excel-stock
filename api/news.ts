// Vercel serverless function: GET /api/news?type=market|company&lang=en|ko&symbols=A,B
// Composes news from every configured source server-side (keys never reach the
// client) and returns a merged NewsItem[]. Node handler (default export, req/res);
// compiled by Vercel/Vite, not `tsc -b`. Types inline (no node @types on api path).
import { getNewsCached } from '../src/server/newsCache.js'
import { guard } from '../src/server/guard.js'
import type { Lang } from '../src/types.js'

declare const process: { env: Record<string, string | undefined> }
interface Req {
  url?: string
  headers: Record<string, string | string[] | undefined>
}
interface Res {
  statusCode: number
  setHeader(key: string, value: string): void
  end(body: string): void
}

// Edge/CDN cache for OK responses. The cache key is the full URL, and language /
// type / symbols all ride as query params (?lang=ko&type=…&symbols=…), so the CDN
// never serves wrong-language or wrong-scope news. Errors are never cached.
const OK_CACHE = 'public, s-maxage=45, stale-while-revalidate=180'

function send(res: Res, status: number, contentType: string, body: string, cache = 'no-store') {
  res.statusCode = status
  res.setHeader('content-type', contentType)
  res.setHeader('cache-control', cache)
  res.end(body)
}

export default async function handler(req: Req, res: Res) {
  const blocked = guard(process.env, req)
  if (blocked) return send(res, blocked.status, 'text/plain', blocked.message)

  const params = new URL(req.url ?? '', 'http://localhost').searchParams
  const type = params.get('type') === 'company' ? 'company' : 'market'
  const lang: Lang = params.get('lang') === 'ko' ? 'ko' : 'en'
  const symbols = (params.get('symbols') ?? '')
    .split(',')
    .filter(Boolean)
    .slice(0, 10)
    .map((s) => s.slice(0, 12).toUpperCase())

  try {
    const items = await getNewsCached(process.env, type, lang, symbols)
    send(res, 200, 'application/json', JSON.stringify(items), OK_CACHE)
  } catch (e) {
    const msg = process.env.NODE_ENV === 'development' ? String(e) : 'upstream error'
    send(res, 502, 'application/json', JSON.stringify({ error: msg }))
  }
}
