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
