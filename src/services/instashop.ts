import { fetch } from 'undici'
import type {
  InstashopLoginRequest,
  InstashopLoginResponse,
  InstashopUpdateRequest,
  InstashopUpdateResponse,
  InstashopErrorResponse,
} from '../types/instashop'

const BASE_URL = 'https://stock-price-api.instashop.com/dev'
const API_KEY = process.env.INSTASHOP_API_KEY ?? ''
const IDENTIFIER = process.env.INSTASHOP_IDENTIFIER ?? ''

let cachedToken: string | null = null

async function login(): Promise<string> {
  const body: InstashopLoginRequest = { apiKey: API_KEY }

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = (await response.json()) as InstashopErrorResponse
    throw new Error(`Instashop login failed [${response.status}]: ${err.message ?? JSON.stringify(err)}`)
  }

  const data = (await response.json()) as InstashopLoginResponse
  cachedToken = data.data.token
  return cachedToken
}

async function getToken(): Promise<string> {
  if (!cachedToken) {
    await login()
  }
  return cachedToken!
}

async function request<T>(path: string, body: unknown, retried = false): Promise<T> {
  const token = await getToken()

  console.log('[instashop] request', JSON.stringify({ path, body }))

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const rawText = await response.text()
  console.log('[instashop] response', JSON.stringify({ path, status: response.status, body: rawText }))

  if (response.status === 401 && !retried) {
    cachedToken = null
    return request<T>(path, body, true)
  }

  if (!response.ok) {
    let err: InstashopErrorResponse
    try {
      err = JSON.parse(rawText) as InstashopErrorResponse
    } catch {
      throw new Error(`Instashop API error [${response.status}]: ${rawText}`)
    }
    throw new Error(`Instashop API error [${response.status}]: ${err.message ?? rawText}`)
  }

  return JSON.parse(rawText) as T
}

export async function updateProducts(
  products: InstashopUpdateRequest['products'],
): Promise<InstashopUpdateResponse> {
  const payload: InstashopUpdateRequest = { identifier: IDENTIFIER, products }
  return request<InstashopUpdateResponse>('/products/update', payload)
}
