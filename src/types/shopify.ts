export interface ShopifyVariant {
  id: number
  product_id: number
  title: string
  sku: string
  barcode: string | null
  inventory_quantity: number
  inventory_item_id: number
  position: number
  price: string
  compare_at_price: string | null
}

export interface ShopifyProductWebhookPayload {
  id: number
  title: string
  status: 'active' | 'archived' | 'draft'
  variants: ShopifyVariant[]
}
