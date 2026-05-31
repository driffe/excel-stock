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

The handlers use the **Web signature** (`export function GET(req: Request): Promise<Response>`),
which Vercel dispatches for `GET` requests on the Node runtime. If a future Vercel
change expects the legacy `export default (req, res)` form instead, that's the one
line to adjust (and mirror it in `vite.config.ts`'s `mod.GET`).

## How it works (dev parity)

- **Dev (`npm run dev` / `npm run preview`)**: `vite.config.ts` injects `.env` into
  `process.env` and serves `/api/quote` + `/api/news` by running the same handler
  modules — identical behavior to production.
- **Prod**: Vercel runs `api/quote.ts` / `api/news.ts` as functions, reading the
  dashboard env vars.

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
