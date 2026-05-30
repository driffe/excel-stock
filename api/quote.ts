// Vercel serverless function: GET /api/quote?symbol=AAPL
// Proxies a single Finnhub quote with the API key attached server-side.
// Uses the Web-handler signature (named `GET` export) — works on Vercel's Node
// runtime and via the Vite dev middleware. Compiled by Vercel/Vite, not `tsc -b`.
import { getQuoteCached } from '../src/server/quoteCache'

export async function GET(req: Request): Promise<Response> {
  const allowed = process.env.ALLOWED_ORIGIN ?? ''
  const origin = req.headers.get('origin') ?? ''
  if (allowed && origin && origin !== allowed) {
    return new Response('Forbidden', { status: 403 })
  }

  const symbol = new URL(req.url).searchParams.get('symbol') ?? ''
  if (!symbol) {
    return new Response(JSON.stringify({ error: 'missing symbol' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }
  try {
    const quote = await getQuoteCached(process.env, symbol)
    return Response.json(quote)
  } catch (e) {
    const msg = process.env.NODE_ENV === 'development' ? String(e) : 'upstream error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
  }
}
