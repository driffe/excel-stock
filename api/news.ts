// Vercel serverless function: GET /api/news?type=market|company&lang=en|ko&symbols=A,B
// Composes news from every configured source server-side (keys never reach the
// client) and returns a merged NewsItem[]. Node handler signature (default export,
// req/res) — what Vercel's Node runtime invokes; the Vite dev middleware passes
// Connect's req/res. Compiled by Vercel/Vite, not `tsc -b`.
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getNewsCached } from '../src/server/newsCache'
import { guard } from '../src/server/guard'
import type { Lang } from '../src/types'

function send(res: ServerResponse, status: number, contentType: string, body: string) {
  res.statusCode = status
  res.setHeader('content-type', contentType)
  res.end(body)
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
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
    send(res, 200, 'application/json', JSON.stringify(items))
  } catch (e) {
    const msg = process.env.NODE_ENV === 'development' ? String(e) : 'upstream error'
    send(res, 502, 'application/json', JSON.stringify({ error: msg }))
  }
}
