// Vercel serverless function: GET /api/quote?symbol=AAPL
// Proxies a single Finnhub quote with the API key attached server-side.
//
// Node handler (default export, req/res) — the form Vercel's Node runtime invokes.
// api/* is compiled by Vercel/Vite (not our `tsc -b`) and node @types aren't on its
// path, so process/req/res are typed inline to keep Vercel's type-check clean.
import { getQuoteCached } from '../src/server/quoteCache.js'
import { guard } from '../src/server/guard.js'

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

// Edge/CDN cache for OK responses: collapse a spike at the PoP so repeated
// same-symbol requests don't re-invoke the function. stale-while-revalidate keeps
// cells populated during the background refresh. Errors/rejections are never cached.
const OK_CACHE = 'public, s-maxage=30, stale-while-revalidate=120'

function send(res: Res, status: number, contentType: string, body: string, cache = 'no-store') {
  res.statusCode = status
  res.setHeader('content-type', contentType)
  res.setHeader('cache-control', cache)
  res.end(body)
}

export default async function handler(req: Req, res: Res) {
  const blocked = guard(process.env, req)
  if (blocked) return send(res, blocked.status, 'text/plain', blocked.message)

  const symbol = new URL(req.url ?? '', 'http://localhost').searchParams.get('symbol') ?? ''
  if (!symbol) return send(res, 400, 'application/json', JSON.stringify({ error: 'missing symbol' }))

  try {
    const quote = await getQuoteCached(process.env, symbol)
    send(res, 200, 'application/json', JSON.stringify(quote), OK_CACHE)
  } catch (e) {
    const msg = process.env.NODE_ENV === 'development' ? String(e) : 'upstream error'
    send(res, 502, 'application/json', JSON.stringify({ error: msg }))
  }
}
