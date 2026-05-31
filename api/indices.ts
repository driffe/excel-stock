// Vercel serverless function: GET /api/indices
// Returns real S&P 500 / Nasdaq / Dow values (server-side, keyless). Node handler
// (default export, req/res); compiled by Vercel/Vite, not `tsc -b`. Types inline.
import { getIndices } from '../src/server/indices.js'
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

function send(res: Res, status: number, contentType: string, body: string) {
  res.statusCode = status
  res.setHeader('content-type', contentType)
  res.end(body)
}

export default async function handler(req: Req, res: Res) {
  const blocked = guard(process.env, req)
  if (blocked) return send(res, blocked.status, 'text/plain', blocked.message)

  try {
    const data = await getIndices()
    send(res, 200, 'application/json', JSON.stringify(data))
  } catch (e) {
    const msg = process.env.NODE_ENV === 'development' ? String(e) : 'upstream error'
    send(res, 502, 'application/json', JSON.stringify({ error: msg }))
  }
}
