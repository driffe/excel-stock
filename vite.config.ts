import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Map proxy routes → the Vercel function module that serves them. The same
// api/*.ts handlers run in dev (here) and in production (Vercel), so behavior
// matches exactly.
const API_ROUTES: Record<string, string> = {
  '/api/quote': '/api/quote.ts',
  '/api/news': '/api/news.ts',
}

/**
 * Dev server for the /api/* proxy: loads the Vercel function module via Vite's
 * SSR loader and invokes it with a Web Request, piping the Response back. Keys
 * come from process.env (populated from .env in the config below), so the same
 * server-side code path runs locally without exposing secrets to the client.
 */
function apiDevServer(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      const mw: Connect.NextHandleFunction = async (req, res, next) => {
        const r = req as {
          url?: string
          originalUrl?: string
          headers?: Record<string, string | string[] | undefined>
        }
        const raw = r.originalUrl ?? r.url ?? ''
        const path = raw.split('?')[0]
        const modPath = API_ROUTES[path]
        if (!modPath) return next()
        // Forward just the headers the server-side guard needs (origin / rate-limit),
        // avoiding forbidden request headers (host, connection, …).
        const FWD = ['origin', 'sec-fetch-site', 'x-forwarded-for', 'x-real-ip']
        const headers: Record<string, string> = {}
        for (const k of FWD) {
          const v = r.headers?.[k]
          if (v != null) headers[k] = Array.isArray(v) ? v.join(',') : String(v)
        }
        const g = globalThis as unknown as {
          Request: new (url: string, init?: { headers?: Record<string, string> }) => unknown
        }
        try {
          const mod = (await server.ssrLoadModule(modPath)) as {
            GET: (req: unknown) => Promise<{
              status: number
              headers: { get(k: string): string | null }
              text(): Promise<string>
            }>
          }
          const response = await mod.GET(new g.Request(`http://localhost${raw}`, { headers }))
          res.statusCode = response.status
          res.setHeader('content-type', response.headers.get('content-type') ?? 'application/json')
          res.end(await response.text())
        } catch (e) {
          res.statusCode = 502
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: String(e) }))
        }
      }
      server.middlewares.use(mw)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  // Expose .env (incl. non-VITE secrets) to the dev /api functions via process.env.
  const g = globalThis as unknown as { process?: { env: Record<string, string | undefined> } }
  if (g.process) Object.assign(g.process.env, env)
  return { plugins: [react(), apiDevServer()] }
})
