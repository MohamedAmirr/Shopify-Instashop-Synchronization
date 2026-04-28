export type InstashopProductStatus = 'in_stock' | 'out_of_stock' | 'disabled'

export type InstashopErrorCode =
  | 'invalid_status'
  | 'price_update_excluded'
  | 'category_excluded'
  | 'stock_update_excluded'
  | 'update_excluded'
  | 'missing_price'
  | 'no_data'
  | 'wrong_prices_shared'

export interface InstashopLoginRequest {
  apiKey: string
}

export interface InstashopLoginResponse {
  success: boolean
  data: {
    identifiers: string[]
    token: string
  }
}

export interface InstashopProductInput {
  plu?: string
  barcode: string
  status?: InstashopProductStatus
  externalInfo?: {
    quantity: number
  }
  price?: string
  discountPrice?: string
}

export interface InstashopUpdateRequest {
  identifier: string
  products: InstashopProductInput[]
}

export interface InstashopUpdateResultItem {
  id: string
  plu?: string
  barcode: string
  status: string
  price?: string
  discountPrice?: string
  update: boolean
  errorMessages: InstashopErrorCode[]
}

export interface InstashopUpdateResponse {
  success: boolean
  identifier: string
  changes: number
  data: InstashopUpdateResultItem[]
}

export interface InstashopErrorResponse {
  success: boolean
  message?: string
  errors?: Array<{ name: string; message: string }>
}
