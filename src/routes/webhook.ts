import type { FastifyInstance } from 'fastify'
import { verifyShopifyWebhook } from '../services/shopify'
import { updateProducts } from '../services/instashop'
import { log } from '../services/logger'
import type { ShopifyProductWebhookPayload, ShopifyVariant } from '../types/shopify'
import type { InstashopProductInput } from '../types/instashop'
import ALLOWED_BARCODES from '../config/barcodes'

const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET ?? ''

const seenPayloads = new Map<string, number>()
const DEDUP_TTL_MS = 60_000

function isDuplicate(key: string): boolean {
  const now = Date.now()
  for (const [k, ts] of seenPayloads) {
    if (now - ts > DEDUP_TTL_MS) seenPayloads.delete(k)
  }
  if (seenPayloads.has(key)) return true
  seenPayloads.set(key, now)
  return false
}

function toInstashopProduct(variant: ShopifyVariant): InstashopProductInput {
  return {
    barcode: variant.barcode!,
    status: variant.inventory_quantity > 0 ? 'in_stock' : 'out_of_stock',
    price: variant.compare_at_price ?? variant.price,
    ...(variant.compare_at_price ? { discountPrice: variant.price } : {}),
  }
}

export async function webhookRoutes(app: FastifyInstance) {
  app.post<{ Body: ShopifyProductWebhookPayload }>('/webhooks/shopify/products-update', {
    handler: async (request, reply) => {
      const hmacHeader = request.headers['x-shopify-hmac-sha256'] as string | undefined
      const rawBody: Buffer = (request as any).rawBody

      if (!verifyShopifyWebhook(rawBody, hmacHeader, WEBHOOK_SECRET)) {
        return reply.status(401).send({ error: 'Unauthorized' })
      }

      const product = request.body

      const allowedVariants = product.variants.filter(
        (v) => v.barcode && ALLOWED_BARCODES.includes(v.barcode),
      )

      if (allowedVariants.length === 0) {
        return reply.status(200).send({ synced: 0 })
      }

      const instashopProducts = allowedVariants.map(toInstashopProduct)

      const dedupKey = `${product.id}:${JSON.stringify(instashopProducts)}`
      if (isDuplicate(dedupKey)) {
        return reply.status(200).send({ skipped: true })
      }

      let result
      try {
        result = await updateProducts(instashopProducts)
      } catch (err) {
        await log({
          level: 'error',
          event: 'instashop_error',
          message: 'Instashop API call failed after all retries',
          productId: product.id,
          productTitle: product.title,
          details: { error: (err as Error).message },
        })
        return reply.status(503).send({ error: 'Instashop API call failed' })
      }

      const updated = result.data.filter((r) => r.update)
      const failed  = result.data.filter((r) => !r.update && r.errorMessages?.length > 0)

      await log({
        level: failed.length > 0 && updated.length === 0 ? 'error' : failed.length > 0 ? 'warn' : 'info',
        event: 'instashop_response',
        message: `Synced ${updated.length} variant(s) for "${product.title}"`,
        productId: product.id,
        productTitle: product.title,
        details: {
          changes: result.changes,
          updated: updated.map((r) => ({ barcode: r.barcode, status: r.status })),
          ...(failed.length > 0
            ? { failed: failed.map((r) => ({ barcode: r.barcode, errors: r.errorMessages })) }
            : {}),
        },
      })

      return reply.status(200).send({
        changes: result.changes,
        total: result.data.length,
        data: result.data,
      })
    },
  })

  app.get('/health', async (_request, reply) => {
    return reply.send({ ok: true })
  })
}
