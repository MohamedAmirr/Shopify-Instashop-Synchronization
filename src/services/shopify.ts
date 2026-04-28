import { createHmac, timingSafeEqual } from 'crypto'

export function verifyShopifyWebhook(
  rawBody: Buffer,
  hmacHeader: string | undefined,
  secret: string,
): boolean {
  if (!hmacHeader) return false

  const digest = createHmac('sha256', secret).update(rawBody).digest('base64')
  const digestBuffer = Buffer.from(digest)
  const hmacBuffer = Buffer.from(hmacHeader)

  if (digestBuffer.length !== hmacBuffer.length) return false

  return timingSafeEqual(digestBuffer, hmacBuffer)
}
