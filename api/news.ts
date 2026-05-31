// Vercel serverless function: GET /api/news?type=market|company&lang=en|ko&symbols=A,B
// Composes news from every configured source server-side (keys never reach the
// client) and returns a merged NewsItem[]. Web-handler signature; compiled by
// Vercel/Vite, not `tsc -b`.
import { getNewsCached } from '../src/server/newsCache'
import { guard } from '../src/server/guard'
import type { Lang } from '../src/types'

export async function GET(req: Request): Promise<Response> {
  const blocked = guard(process.env, req)
  if (blocked) return blocked

  const params = new URL(req.url).searchParams
  const type = params.get('type') === 'company' ? 'company' : 'market'
  const lang: Lang = params.get('lang') === 'ko' ? 'ko' : 'en'
  const symbols = (params.get('symbols') ?? '')
    .split(',')
    .filter(Boolean)
    .slice(0, 10)
    .map((s) => s.slice(0, 12).toUpperCase())
  try {
    const items = await getNewsCached(process.env, type, lang, symbols)
    return Response.json(items)
  } catch (e) {
    const msg = process.env.NODE_ENV === 'development' ? String(e) : 'upstream error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
  }
}
