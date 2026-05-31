// Request guard for the /api/* proxy: a same-origin check plus a per-IP rate
// limit, so a third party can't quietly drain the Finnhub/Marketaux quota.
//
// Both are best-effort for a low-traffic deploy: in-memory state lives only in a
// warm process/instance, and header checks can be spoofed by non-browser clients —
// the rate limit is the backstop. For hard guarantees, set ALLOWED_ORIGIN and/or
// front the app with a managed rate limiter (Vercel KV / Upstash).
type Env = Record<string, string | undefined>

const WINDOW_MS = 60_000
const DEFAULT_MAX_PER_MIN = 240
const MAX_TRACKED_IPS = 10_000

const hits = new Map<string, { count: number; resetAt: number }>()

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') ?? ''
  return xff.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
}

/**
 * When ALLOWED_ORIGIN is set, allow only same-origin requests: a matching Origin
 * header, or — since same-origin GETs often omit Origin — a Sec-Fetch-Site of
 * same-origin/none. A request with neither signal (e.g. curl) is denied. When
 * ALLOWED_ORIGIN is unset, the origin check is off (rate limit still applies).
 */
function originAllowed(req: Request, allowed: string): boolean {
  if (!allowed) return true
  const origin = req.headers.get('origin')
  if (origin) return origin === allowed
  const site = req.headers.get('sec-fetch-site')
  if (site) return site === 'same-origin' || site === 'none'
  return false
}

function rateLimited(req: Request, max: number): boolean {
  const ip = clientIp(req)
  const now = Date.now()
  if (hits.size > MAX_TRACKED_IPS) hits.clear() // cheap backstop vs. IP-rotation spam
  const entry = hits.get(ip)
  if (!entry || now >= entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > max
}

/** Returns a blocking Response (403/429) if the request should be rejected, else null. */
export function guard(env: Env, req: Request): Response | null {
  if (!originAllowed(req, env.ALLOWED_ORIGIN ?? '')) {
    return new Response('Forbidden', { status: 403, headers: { 'content-type': 'text/plain' } })
  }
  const max = Number(env.RATE_LIMIT_PER_MIN ?? '') || DEFAULT_MAX_PER_MIN
  if (rateLimited(req, max)) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: { 'content-type': 'text/plain', 'retry-after': '60' },
    })
  }
  return null
}
