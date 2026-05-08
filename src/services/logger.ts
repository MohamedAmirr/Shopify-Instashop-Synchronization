import pool from './db'

export type LogLevel = 'info' | 'warn' | 'error'

export type LogEvent =
  | 'webhook_received'
  | 'webhook_skipped'
  | 'webhook_duplicate'
  | 'webhook_hmac_failed'
  | 'instashop_request'
  | 'instashop_response'
  | 'instashop_retry'
  | 'instashop_error'
  | 'instashop_partial_failure'
  | 'server_error'

interface LogEntry {
  level: LogLevel
  event: LogEvent
  message: string
  productId?: number | string
  productTitle?: string
  details?: Record<string, unknown>
}

export async function log(entry: LogEntry): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO logs (level, event, message, product_id, product_title, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.level,
        entry.event,
        entry.message,
        entry.productId ?? null,
        entry.productTitle ?? null,
        entry.details ? JSON.stringify(entry.details) : null,
      ],
    )
  } catch (err) {
    // Never let logging failures crash the main flow
    console.error('[logger] failed to write log:', err)
  }
}
