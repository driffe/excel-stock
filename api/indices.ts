// Vercel serverless function: GET /api/indices
// Returns real S&P 500 / Nasdaq / Dow values (server-side, keyless). Node handler
// signature; compiled by Vercel/Vite, not `tsc -b`.
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getIndices } from '../src/server/indices'
import { guard } from '../src/server/guard'

function send(res: ServerResponse, status: number, contentType: string, body: string) {
  res.statusCode = status
  res.setHeader('content-type', contentType)
  res.end(body)
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
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
