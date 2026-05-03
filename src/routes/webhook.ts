import type { FastifyInstance } from 'fastify'
import { verifyShopifyWebhook } from '../services/shopify'
import { updateProducts } from '../services/instashop'
import type { ShopifyProductWebhookPayload, ShopifyVariant } from '../types/shopify'
import type { InstashopProductInput } from '../types/instashop'
import ALLOWED_BARCODES from '../config/barcodes'

const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET ?? ''

function toInstashopProduct(variant: ShopifyVariant): InstashopProductInput {
  return {
    barcode: variant.barcode!,
    status: variant.inventory_quantity > 0 ? 'in_stock' : 'out_of_stock',
  }
}

export async function webhookRoutes(app: FastifyInstance) {
  app.post<{ Body: ShopifyProductWebhookPayload }>('/webhooks/shopify/products-update', {
    handler: async (request, reply) => {
      const hmacHeader = request.headers['x-shopify-hmac-sha256'] as string | undefined
      const rawBody: Buffer = (request as any).rawBody

      if (!verifyShopifyWebhook(rawBody, hmacHeader, WEBHOOK_SECRET)) {
        app.log.warn('Shopify HMAC verification failed')
        return reply.status(401).send({ error: 'Unauthorized' })
      }

      const product = request.body
      app.log.info({ productId: product.id, title: product.title }, 'Received products/update')

      const allowedVariants = product.variants.filter(
        (v) => v.barcode && ALLOWED_BARCODES.includes(v.barcode),
      )

      if (allowedVariants.length === 0) {
        app.log.info(
          { productId: product.id, totalVariants: product.variants.length },
          'No variants matched the barcode allowlist — skipping',
        )
        return reply.status(200).send({ synced: 0 })
      }

      const instashopProducts = allowedVariants.map(toInstashopProduct)

      app.log.info({ productId: product.id, request: instashopProducts }, 'Sending to Instashop')

      let result
      try {
        result = await updateProducts(instashopProducts)
      } catch (err) {
        app.log.error({ productId: product.id, err }, 'Instashop API call failed after all retries')
        return reply.status(200).send({ error: 'Instashop API call failed' })
      }

      app.log.info(
        {
          productId: product.id,
          identifier: result.identifier,
          changes: result.changes,
          total: result.data.length,
          results: result.data.map((r) => ({
            barcode: r.barcode,
            status: r.status,
            update: r.update,
            errorMessages: r.errorMessages,
          })),
        },
        'Instashop response',
      )

      const failed = result.data.filter((r) => !r.update && r.errorMessages?.length > 0)
      if (failed.length > 0) {
        app.log.warn(
          {
            productId: product.id,
            failed: failed.map((r) => ({ barcode: r.barcode, errorMessages: r.errorMessages })),
          },
          'Some variants were not updated in Instashop',
        )
      }

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
