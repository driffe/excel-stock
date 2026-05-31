import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Map proxy routes → the Vercel function module that serves them. The same
// api/*.ts handlers run in dev (here) and in production (Vercel), so behavior
// matches exactly.
const API_ROUTES: Record<string, string> = {
  '/api/quote': '/api/quote.ts',
  '/api/news': '/api/news.ts',
  '/api/indices': '/api/indices.ts',
}

/**
 * Dev server for the /api/* proxy: loads the Vercel function module via Vite's
 * SSR loader and invokes its default (req, res) handler with Connect's Node
 * req/res — exactly how Vercel's Node runtime invokes it, so behavior matches.
 * Keys come from process.env (populated from .env in the config below).
 */
function apiDevServer(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      const mw: Connect.NextHandleFunction = async (req, res, next) => {
        const r = req as { originalUrl?: string; url?: string }
        const raw = r.originalUrl ?? r.url ?? ''
        const path = raw.split('?')[0]
        const modPath = API_ROUTES[path]
        if (!modPath) return next()
        try {
          const mod = (await server.ssrLoadModule(modPath)) as {
            default: (req: unknown, res: unknown) => Promise<void>
          }
          await mod.default(req, res)
        } catch (e) {
          res.statusCode = 500
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
