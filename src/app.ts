import Fastify from 'fastify'
import { webhookRoutes } from './routes/webhook'
import { logsRoutes } from './routes/logs'
import { dashboardRoutes } from './routes/dashboard'
import { cleanupRoutes } from './routes/cleanup'
import { initDb } from './services/db'

function ts() {
  return new Date().toISOString()
}

function statusColor(code: number): string {
  if (code >= 500) return '\x1b[31m'  // red
  if (code >= 400) return '\x1b[33m'  // yellow
  if (code >= 300) return '\x1b[36m'  // cyan
  return '\x1b[32m'                   // green
}

const reset = '\x1b[0m'
const dim   = '\x1b[2m'
const bold  = '\x1b[1m'

export function buildApp() {
  const app = Fastify({ logger: false })

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
    console.log(`${dim}[${ts()}]${reset} ${bold}Server ready${reset}`)
  })

  // Log every incoming request
  app.addHook('onRequest', async (request) => {
    ;(request as any).startMs = Date.now()
    console.log(
      `${dim}[${ts()}]${reset} ${bold}→${reset} ${request.method.padEnd(6)} ${request.url}`,
    )
  })

  // Log every completed response
  app.addHook('onResponse', async (request, reply) => {
    const ms = Date.now() - ((request as any).startMs ?? Date.now())
    const code = reply.statusCode
    const color = statusColor(code)
    console.log(
      `${dim}[${ts()}]${reset} ${color}${bold}←${reset} ${color}${code}${reset}  ${request.method.padEnd(6)} ${request.url}  ${dim}${ms}ms${reset}`,
    )
  })

  // Log errors before they become 5xx responses
  app.addHook('onError', async (request, _reply, error) => {
    console.error(
      `${dim}[${ts()}]${reset} \x1b[31m${bold}✗ ERROR${reset}  ${request.method} ${request.url}\n` +
      `         ${error.message}\n` +
      `${dim}${error.stack ?? ''}${reset}`,
    )
  })

  app.register(webhookRoutes)
  app.register(logsRoutes)
  app.register(cleanupRoutes)
  app.register(dashboardRoutes)

  return app
}
