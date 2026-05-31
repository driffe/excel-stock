// Request guard for the /api/* proxy: a same-origin check plus a per-IP rate
// limit, so a third party can't quietly drain the Finnhub/Marketaux quota.
//
// Reads Node-style request headers (a plain object), so it works with both the
// Vercel function handler and the Vite dev middleware (Connect req/res). Both are
// best-effort for a low-traffic deploy: in-memory state lives only in a warm
// process/instance, and header checks can be spoofed by non-browser clients — the
// rate limit is the backstop. For hard guarantees, set ALLOWED_ORIGIN and/or front
// the app with a managed rate limiter (Vercel KV / Upstash).
type Env = Record<string, string | undefined>
type ReqLike = { headers: Record<string, string | string[] | undefined> }

const WINDOW_MS = 60_000
const DEFAULT_MAX_PER_MIN = 240
const MAX_TRACKED_IPS = 10_000

const hits = new Map<string, { count: number; resetAt: number }>()

function header(req: ReqLike, name: string): string {
  const v = req.headers[name]
  if (Array.isArray(v)) return v[0] ?? ''
  return v ?? ''
}

function clientIp(req: ReqLike): string {
  const xff = header(req, 'x-forwarded-for')
  return xff.split(',')[0].trim() || header(req, 'x-real-ip') || 'unknown'
}

/**
 * When ALLOWED_ORIGIN is set, allow only same-origin requests: a matching Origin
 * header, or — since same-origin GETs often omit Origin — a Sec-Fetch-Site of
 * same-origin/none. A request with neither signal (e.g. curl) is denied. When
 * ALLOWED_ORIGIN is unset, the origin check is off (rate limit still applies).
 */
function originAllowed(req: ReqLike, allowed: string): boolean {
  if (!allowed) return true
  const origin = header(req, 'origin')
  if (origin) return origin === allowed
  const site = header(req, 'sec-fetch-site')
  if (site) return site === 'same-origin' || site === 'none'
  return false
}

function rateLimited(req: ReqLike, max: number): boolean {
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

/** Returns a status+message to reject with (403/429), or null to allow. */
export function guard(env: Env, req: ReqLike): { status: number; message: string } | null {
  if (!originAllowed(req, env.ALLOWED_ORIGIN ?? '')) {
    return { status: 403, message: 'Forbidden' }
  }
  const max = Number(env.RATE_LIMIT_PER_MIN ?? '') || DEFAULT_MAX_PER_MIN
  if (rateLimited(req, max)) {
    return { status: 429, message: 'Too Many Requests' }
  }
  return null
}
