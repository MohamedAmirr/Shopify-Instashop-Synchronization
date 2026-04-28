import Fastify from 'fastify'
import { webhookRoutes } from './routes/webhook'

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

  app.register(webhookRoutes)

  return app
}
