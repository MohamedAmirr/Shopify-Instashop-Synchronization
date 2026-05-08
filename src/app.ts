import Fastify from 'fastify'
import { webhookRoutes } from './routes/webhook'
import { logsRoutes } from './routes/logs'
import { dashboardRoutes } from './routes/dashboard'
import { cleanupRoutes } from './routes/cleanup'
import { initDb } from './services/db'

function ts() {
  return new Date().toISOString()
}

export function buildApp() {
  const app = Fastify({ logger: true })

  // Capture the raw body for Shopify HMAC verification before JSON parsing
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    ;(req as any).rawBody = body
    try {
      done(null, JSON.parse(body.toString()))
    } catch (err) {
      done(err as Error)
    }
  })

  app.addHook('onReady', async () => {
    await initDb()
    console.log(`[${ts()}] Server ready`)
  })

  app.addHook('onRequest', async (request) => {
    ;(request as any).startMs = Date.now()
    console.log(`[${ts()}] --> ${request.method} ${request.url}`)
  })

  app.addHook('onResponse', async (request, reply) => {
    const ms = Date.now() - ((request as any).startMs ?? Date.now())
    console.log(`[${ts()}] <-- ${reply.statusCode} ${request.method} ${request.url} (${ms}ms)`)
  })

  app.addHook('onError', async (request, _reply, error) => {
    console.error(`[${ts()}] ERROR ${request.method} ${request.url} — ${error.message}`)
    if (error.stack) console.error(error.stack)
  })

  app.register(webhookRoutes)
  app.register(logsRoutes)
  app.register(cleanupRoutes)
  app.register(dashboardRoutes)

  return app
}
