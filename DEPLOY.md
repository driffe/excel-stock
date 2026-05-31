# Deploying to Vercel

The app talks to external APIs only through same-origin `/api/*` proxy endpoints
(`api/quote.ts`, `api/news.ts`). All API keys live in **server-side** env vars
(no `VITE_` prefix), so they are never bundled into the client.

## 1. Set environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Required for | Notes |
|---|---|---|
| `VITE_QUOTE_PROVIDER` | live mode | Set to `finnhub` for live data; omit/`mock` for the offline demo. **Client-visible** (not a secret). |
| `VITE_REFRESH_MS` | optional | Quote poll interval (ms). Default 15000. Client-visible. |
| `FINNHUB_API_KEY` | quotes + EN news | **Secret** — server-side only. |
| `MARKETAUX_API_TOKEN` | EN news | **Secret** — server-side only. |
| `NAVER_CLIENT_ID` | KO news | **Secret** — server-side only. |
| `NAVER_CLIENT_SECRET` | KO news | **Secret** — server-side only. |
| `ALLOWED_ORIGIN` | **recommended** | Lock `/api/*` to your deploy URL (e.g. `https://your-app.vercel.app`). Without it the proxy is open to the world. |
| `RATE_LIMIT_PER_MIN` | optional | Per-IP cap on `/api/*` (default 240). |
| `QUOTE_TTL_MS` | optional | Stooq snapshot TTL for shared default symbols (default 30000). The spike dial — raise it during a launch to cut upstream load further. |

Only set the keys for the sources you use; the proxy enables each source whose
key(s) are present and falls back to mock/empty otherwise.

## 2. Deploy

Push to a Git repo connected to Vercel, or run `vercel`. Vercel auto-detects the
Vite app: builds to `dist/`, serves the SPA, and exposes `api/*.ts` as Node
serverless functions. `vercel.json` pins the build/output and the SPA rewrite
(everything except `/api/*` falls back to `index.html`).

## Verify the function runtime before trusting prod

The dev middleware (`npm run dev`) exercises the handler *logic*, but not Vercel's
actual function runtime. Confirm the real runtime once with either:

- `npx vercel dev` (runs Vercel's runtime locally; needs `vercel login`/`link`), then
  `curl "http://localhost:3000/api/quote?symbol=AAPL"` and `curl "http://localhost:3000/api/news?type=market&lang=en"` — expect JSON, not an error page.
- or a throwaway preview deploy and hit the same endpoints.

The handlers use the **Node signature** (`export default async function handler(req, res)`
with `req.url` / `req.headers` and `res.statusCode`/`res.end`) — the form Vercel's Node
runtime invokes. The Vite dev middleware calls the same `default(req, res)` with Connect's
Node req/res, so dev and prod run the identical handler.

## How it works (dev parity)

- **Dev (`npm run dev` / `npm run preview`)**: `vite.config.ts` injects `.env` into
  `process.env` and serves `/api/quote` + `/api/news` by running the same handler
  modules — identical behavior to production.
- **Prod**: Vercel runs `api/quote.ts` / `api/news.ts` as functions, reading the
  dashboard env vars.

## Launch hardening (surviving a viral spike)

A Show HN / Reddit spike sends hundreds of concurrent viewers at the **default
watchlist**. The data layer is built so upstream load stays **constant regardless
of viewer count** — the live prices won't break at the worst moment:

- **Shared default symbols → Stooq's keyless batch.** Every default-watchlist
  symbol (`SHARED_SYMBOLS`, seeded from `data/sheets.ts`) is served by one batched,
  keyless Stooq request (`src/server/stooqQuotes.ts`), TTL-cached and
  request-coalesced. Upstream load ≈ (distinct symbols ÷ `QUOTE_TTL_MS`), **not ×
  viewers**. The batch includes the previous close (`p` field), so change % is vs.
  **previous close** — the same basis as Finnhub and Yahoo/Google, so default and
  user-added rows stay consistent. Trade-off: Stooq is ~15 min delayed (acceptable
  for the casual-checker launch view); **verify the intraday delay/cadence on a live
  weekday session** before treating it as launch-ready.
- **User-added symbols → Finnhub** on-demand (real-time), bounded by the per-IP
  rate limit. Stooq is the fallback if Finnhub is absent/errors.
- **Edge/CDN caching.** `/api/{quote,news,indices}` send
  `Cache-Control: public, s-maxage=…, stale-while-revalidate=…` on OK responses, so
  the CDN absorbs repeat requests per PoP without re-invoking the function; errors
  are `no-store`. This is a multiplier on top of the constant-quota source.

**Pre-launch checklist:**

1. **Set `ALLOWED_ORIGIN`** to your deploy URL — closes the open proxy so nobody
   can drain your Finnhub quota by hitting `/api/*` directly.
2. **Raise `QUOTE_TTL_MS`** (e.g. 60000) for the launch window to cut upstream load
   further; lower it back afterward.
3. **Smoke-test live prices** on a preview deploy (`/api/quote?symbol=AAPL` returns a
   price; the default grid fills) — the hero demo depends on prices being live.
4. Optional: front `/api/*` with a managed limiter (Vercel KV / Upstash) if you
   expect abuse beyond the in-memory backstop.

**Verify on a preview deploy before the real launch** (these can't be checked from
the Vite dev server, which has no CDN, or on a weekend with frozen data):

- **Edge cache is live:** `curl -sI <preview>/api/quote?symbol=AAPL` shows
  `cache-control: ... s-maxage=…`, and a second identical request is served from the
  CDN (Vercel `x-vercel-cache: HIT`) without re-invoking the function.
- **Live market-hours behavior:** during a weekday session, confirm the default grid
  updates on the Stooq cadence and the change % matches Yahoo/Google for a few names.

## Security notes

- Client bundle contains **no API keys** — verify with
  `npm run build && grep -r "<your key>" dist/` (expect 0 matches).
- Naver runs server-side in direct mode (its Open API is CORS-blocked and the
  secret must never reach the browser).
- The `/api/*` proxy is **open by default** — anyone could call it and drain your
  Finnhub/Marketaux quota. Set `ALLOWED_ORIGIN` to your deploy URL; a per-IP rate
  limit (`RATE_LIMIT_PER_MIN`, default 240) is always on as a backstop. Both are
  best-effort (in-memory, header-based); for hard guarantees front the app with a
  managed rate limiter (Vercel KV / Upstash).
