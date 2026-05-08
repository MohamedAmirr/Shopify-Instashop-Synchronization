import { fetch } from 'undici'
import type {
  InstashopLoginRequest,
  InstashopLoginResponse,
  InstashopUpdateRequest,
  InstashopUpdateResponse,
  InstashopErrorResponse,
} from '../types/instashop'

const BASE_URL = 'https://stock-price-api.instashop.com'
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

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const rawText = await response.text()

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

const RETRY_ATTEMPTS = 2
const RETRY_DELAY_MS = 200

export async function updateProducts(
  products: InstashopUpdateRequest['products'],
): Promise<InstashopUpdateResponse> {
  const payload: InstashopUpdateRequest = { identifier: IDENTIFIER, products }

  let lastError: Error | undefined
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await request<InstashopUpdateResponse>('/products/update', payload)
    } catch (err) {
      lastError = err as Error
      if (attempt < RETRY_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))
      }
    }
  }

  throw lastError
}
