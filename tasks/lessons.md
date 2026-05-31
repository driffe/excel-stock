# Lessons

Patterns captured after user corrections / verification gaps, per CLAUDE.md "Self-Improvement Loop".

## Verification

- **Browser visual verification IS possible here even without a local Playwright install.**
  A previous run concluded "no browser automation available" and skipped visual checks. In fact:
  `npx playwright` resolves a cached copy under `~/.npm/_npx/<hash>/node_modules/playwright`, and
  Chrome exists at `/Applications/Google Chrome.app/.../Google Chrome`. Drive it headless via
  `chromium.launch({ executablePath: <chrome>, headless: true })` against the running `npm run dev`
  server, assert DOM text + screenshot. Import the cached module by absolute path with the CommonJS
  form `import pw from '<path>/index.js'; const { chromium } = pw` (named export fails). Always
  do a real render to catch runtime-only bugs (e.g. a narrow grid column clipping right-aligned
  numbers) that typecheck/build never surface.

## Live-mode rate limits

- **Cap concurrency when fanning out to free-tier quote APIs.** Loading a 10-symbol
  sheet fired all 10 Finnhub `/quote` calls at once; React StrictMode (dev) doubles the
  mount, so ~20 near-simultaneous calls + the news fan-out tripped Finnhub's burst limit →
  `429`s cascaded and the grid showed all `—` (no prices), while news still worked. Fix:
  `src/lib/pool.ts` `mapPoolSettled(items, limit, fn)` (concurrency cap, used by `useQuotes`
  at limit 4). After: 0×429, live prices populate. Verify live mode by capturing network
  responses per host in headless Playwright (status-code histogram), not just a screenshot —
  mock vs live looks identical on screen but the network tab proves which sources answered.

## Browser API keys & proxy (Vite + Vercel)

- **Any `VITE_`-prefixed var is baked into the client bundle** — fine for flags
  (`VITE_QUOTE_PROVIDER`), never for secrets. To hide keys: route all external calls
  through same-origin `/api/*`, keep keys in NON-`VITE_` server env. Client uses
  `ProxyQuoteProvider`/`ProxyNewsProvider`; the secret-bearing adapter classes are
  imported only by server code (`api/_lib/`) so they tree-shake out of the client bundle.
  Verify: `npm run build && grep -r "<key>" dist/` → 0.
- **Dev/prod parity without duplicating logic**: write the handler once as a Web
  `Request`→`Response` module under `api/*.ts` (Vercel functions in prod); in dev, a Vite
  plugin runs the *same* module via `server.ssrLoadModule(path)` and injects `.env` into
  `process.env` (`Object.assign(process.env, loadEnv(mode,'.',''))`).
- **Keep `api/` out of `tsc -b`** (not in any tsconfig) to dodge multi-project/`composite`
  pain and missing node/DOM lib types — Vercel and Vite compile it at runtime. Keep those
  files thin and delegate to typechecked `src/` code.
- **Per-symbol proxy + free-tier APIs needs server-side request coalescing**, not just a
  client concurrency cap: StrictMode's double mount and overlapping polls fire duplicate
  `/api/quote` calls that each hit Finnhub → 429→502. An in-flight-promise cache keyed by
  symbol (+ short TTL) collapses them to one upstream call. See `api/_lib/quoteCache.ts`.

## News source accuracy (Finnhub)

- Finnhub news returns a `finnhub.io/api/news?id=…` **redirect** `url` and a generic
  aggregator `source` ("Yahoo") — so a Motley Fool article hosted on Yahoo displays as
  "Yahoo", and links don't show the real publisher. The redirect only resolves with a
  browser `User-Agent` (server-side `curl -I` without UA loops to finnhub.io home; `GET`
  with a Chrome UA → `www.fool.com/...`). Fix in `src/api/resolveSource.ts`: follow the
  redirect server-side (browser UA, HEAD-like GET with body cancelled, `AbortSignal`
  timeout), re-label `source` from the real domain (domain→name map, else the domain
  itself), id-keyed cache + concurrency cap. Only touches finnhub.io links, so it never
  adds requests for already-real URLs (market news from cnbc.com etc.).
- Finnhub's company-news endpoint tags **loosely**-related articles with the queried symbol
  (a Datadog/Buffett piece comes back tagged "NVDA"). Don't trust its `related` — re-derive
  it from actual mentions in headline+summary (`src/api/tickerMatch.ts`: ticker ≥3 chars +
  first distinctive company-name word + aliases like Google/Facebook). Articles naming no
  watchlist symbol get `[]` → "—" in the Ticker column, which is honest.

## Securing an open proxy (this app)

- **Origin checks must not `&& origin`.** `if (allowed && origin && origin !== allowed)`
  lets any request with NO Origin header through — exactly the curl/script abuse you're
  trying to stop. But you also can't just deny missing-Origin: **same-origin GETs often
  omit Origin**. Correct gate (`src/server/guard.ts`): allow if Origin matches, else if
  `Sec-Fetch-Site` is `same-origin`/`none`, else deny. Header checks are spoofable by
  non-browsers, so pair with a per-IP rate limit (the real backstop). The `/api/*` proxy
  is **open by default** — drains your upstream quota — so recommend `ALLOWED_ORIGIN` in docs.
- **Cache the composing endpoint.** `/api/news` fans out to 3 upstreams per call; without a
  TTL cache it's the cheapest endpoint to hammer. `src/server/newsCache.ts` mirrors the
  quote cache (TTL + in-flight coalescing).
- **SSRF on redirect resolution:** to get a real article URL from a `finnhub.io/...?id=`
  redirect, use `redirect: 'manual'` and read the `Location` header — do NOT `redirect:'follow'`
  (that issues a request to the target host). Validate the Location is a public host (reject
  loopback/private/link-local `169.254/127/10/172.16-31/192.168`, `::1`, `fe80/fc/fd`,
  `localhost`, and finnhub itself) before trusting it. See `src/api/resolveSource.ts`.
- In-memory caches/rate-counters in serverless persist only per warm instance and grow
  unbounded — add a size cap (`if (map.size > N) map.clear()`).

## React polling: keep the fetch key independent of live data

- The quote/news poll effects key on `symbols.join(',')`. If that list is **re-sorted by live
  quote values** (the favorites sheet sorted by price), every tick reorders it → key changes →
  effect tears down and refetches immediately → runaway polling. Fix: compute the polling list
  in a STABLE order; apply quote-based sort only to the display list (`view`), never to the
  list that feeds the effect key. (Verified: 35s on a sorted fav sheet = ~6 requests, not hundreds.)
- Cell-flash coordinates must be derived from the **displayed** rows (`view`, post-filter/sort),
  not the raw symbol list — otherwise the highlight lands on the wrong row when a filter is on.

## Tests & tooling

- Vitest is wired (`npm test` = `vitest run`). `vitest.config.ts` uses `environment: 'node'`
  and `include: ['src/**/*.test.ts']` — the unit suites are pure functions (format, pool,
  tickerMatch, compositeNews merge/affinity, i18n key+token parity), so no jsdom/React needed.
  The i18n parity test catches drift the `Record<TranslationKey,string>` type can't (token
  mismatches, empty values). 23 tests as of the batch-3 review.
- ESLint 9 needs a flat `eslint.config.js`; `api/` is in `ignores` (it uses Web/Node globals
  not in the app tsconfig). Extracting a `symbolsKey` variable resolves the
  `react-hooks/exhaustive-deps` "complex expression in dependency array" warning.
- **Arm window listeners once.** A keydown effect that depends on `view`/`sel` re-adds the
  listener on every render (every quote tick). Instead assign the handler to a ref each render
  (`onKeyRef.current = …`) and add the listener in a `[]` effect that calls `onKeyRef.current(e)`
  — fresh closures, one listener. Same pattern works for any high-churn global handler.

## Grid render cost & a11y (batch 4)

- The watchlist grid re-renders all cells on every quote tick. Full virtualization is
  overkill at this scale and risks breaking selection/edit/flash; instead render a fixed
  `SHEET_ROWS` (50, fills the viewport) for watchlists and `getDecoy(lang).rows.length` for
  the decoy (~80 rows — a global cap would truncate it). ~50% fewer cells, no functional change.
- Icon controls that are `<div onClick>` become keyboard-operable without changing the tag or
  CSS: add `role="button" tabIndex={0}`, `aria-label`, and `onKeyDown={onActivate(fn)}`
  (`src/lib/a11y.ts` — fires on Enter/Space). Pair with `[role="button"]:focus-visible { outline }`
  so the focus ring is visible. Verified: Tab+Enter on the language toggle flips EN↔KO.
- When testing keyboard flows in Playwright, focus matters: a `keyboard.press('Backquote')` while
  a focusable control is focused may not reach the window-level boss-key handler the same way —
  click into the grid first, or assert the isolated path.

## Design handoff bundles (Claude Design)

- A `WebFetch` of a Claude Design handoff URL returns a **gzipped tar**, not HTML — `WebFetch`
  reports it as "binary/corrupted". Recover it: the bytes are saved to a `.bin` under the session
  tool-results dir; `gunzip -c <bin> | tar -xf - -C /tmp/...` extracts `README.md`, `chats/`, and
  `project/` (the real source + screenshots). Read the **chat transcript** first — intent lives there.
- The bundle README says to recreate the design pixel-perfectly in whatever tech fits, NOT to copy
  the prototype's structure. A hand-built Excel chrome (column letters, green selection, data bars,
  autofilter) justified dropping `react-datasheet-grid` for a custom CSS-grid port.

## i18n

- Type the non-default dictionary as `Record<keyof typeof en, string>` so missing/extra keys fail
  typecheck — keeps EN/KO in lockstep. Dynamic keys (e.g. `'index.' + key`) need an explicit
  `as TranslationKey` cast.
