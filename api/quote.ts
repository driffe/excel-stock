// Vercel serverless function: GET /api/quote?symbol=AAPL
// Proxies a single Finnhub quote with the API key attached server-side.
//
// Uses the Node handler signature (default export, req/res) — the form Vercel's
// Node runtime invokes. The same handler runs in dev via the Vite middleware,
// which passes Connect's Node req/res. Compiled by Vercel/Vite, not `tsc -b`.
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getQuoteCached } from '../src/server/quoteCache.js'
import { guard } from '../src/server/guard.js'

function send(res: ServerResponse, status: number, contentType: string, body: string) {
  res.statusCode = status
  res.setHeader('content-type', contentType)
  res.end(body)
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const blocked = guard(process.env, req)
  if (blocked) return send(res, blocked.status, 'text/plain', blocked.message)

  const symbol = new URL(req.url ?? '', 'http://localhost').searchParams.get('symbol') ?? ''
  if (!symbol) return send(res, 400, 'application/json', JSON.stringify({ error: 'missing symbol' }))

  try {
    const quote = await getQuoteCached(process.env, symbol)
    send(res, 200, 'application/json', JSON.stringify(quote))
  } catch (e) {
    const msg = process.env.NODE_ENV === 'development' ? String(e) : 'upstream error'
    send(res, 502, 'application/json', JSON.stringify({ error: msg }))
  }
}
