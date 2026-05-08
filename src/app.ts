import Fastify from 'fastify'
import { webhookRoutes } from './routes/webhook'
import { logsRoutes } from './routes/logs'
import { dashboardRoutes } from './routes/dashboard'
import { initDb } from './services/db'

export function buildApp() {
  const app = Fastify({
    logger: true,
  })

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
  })

  app.register(webhookRoutes)
  app.register(logsRoutes)
  app.register(dashboardRoutes)

  return app
}
