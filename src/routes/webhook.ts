import type { FastifyInstance } from 'fastify'
import { verifyShopifyWebhook } from '../services/shopify'
import { updateProducts } from '../services/instashop'
import type { ShopifyProductWebhookPayload, ShopifyVariant } from '../types/shopify'
import type { InstashopProductInput, InstashopProductStatus } from '../types/instashop'

const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET ?? ''

function toInstashopStatus(
  productStatus: ShopifyProductWebhookPayload['status'],
  inventoryQuantity: number,
): InstashopProductStatus {
  if (productStatus !== 'active') return 'disabled'
  return inventoryQuantity > 0 ? 'in_stock' : 'out_of_stock'
}

function toInstashopProduct(
  variant: ShopifyVariant,
  productStatus: ShopifyProductWebhookPayload['status'],
): InstashopProductInput {
  const status = toInstashopStatus(productStatus, variant.inventory_quantity)

  const product: InstashopProductInput = {
    barcode: variant.barcode!,
    status,
    externalInfo: { quantity: variant.inventory_quantity },
  }

  // If compare_at_price exists, it's the original (crossed-out) price and
  // variant.price is the discounted selling price.
  if (variant.compare_at_price) {
    product.price = variant.compare_at_price
    product.discountPrice = variant.price
  } else {
    product.price = variant.price
  }

  return product
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

      const variantsWithBarcodes = product.variants.filter((v) => Boolean(v.barcode))
      if (variantsWithBarcodes.length === 0) {
        app.log.info({ productId: product.id }, 'No barcodes on any variant — skipping')
        return reply.status(200).send({ synced: 0, skipped: product.variants.length })
      }

      const instashopProducts = variantsWithBarcodes.map((v) =>
        toInstashopProduct(v, product.status),
      )

      const result = await updateProducts(instashopProducts)

      const failed = result.data.filter((r) => !r.update && r.errorMessages.length > 0)
      if (failed.length > 0) {
        app.log.warn({ failed }, 'Some variants were not updated in Instashop')
      }

      app.log.info(
        { productId: product.id, changes: result.changes, total: result.data.length },
        'Instashop sync complete',
      )

      // Always 200 to Shopify — it retries on anything else
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
