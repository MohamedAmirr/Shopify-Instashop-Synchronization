import type { FastifyInstance } from 'fastify'
import pool from '../services/db'

interface LogsQuery {
  level?: string
  event?: string
  search?: string
  from?: string
  to?: string
  limit?: string
  offset?: string
}

export async function logsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: LogsQuery }>('/api/logs', async (request, reply) => {
    const { level, event, search, from, to, limit = '50', offset = '0' } = request.query

    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1

    if (level) {
      conditions.push(`level = $${i++}`)
      params.push(level)
    }
    if (event) {
      conditions.push(`event = $${i++}`)
      params.push(event)
    }
    if (search) {
      conditions.push(`(message ILIKE $${i} OR product_title ILIKE $${i} OR details::text ILIKE $${i})`)
      params.push(`%${search}%`)
      i++
    }
    if (from) {
      conditions.push(`created_at >= $${i++}`)
      params.push(from)
    }
    if (to) {
      conditions.push(`created_at <= $${i++}`)
      params.push(to)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Single round-trip: CTE computes stats over the full filtered set,
    // then we paginate and cross-join the aggregates onto every returned row.
    const result = await pool.query(
      `WITH base AS (
         SELECT id, level, event, message, product_id, product_title, details, created_at
         FROM logs ${where}
       ),
       stats AS (
         SELECT
           COUNT(*)                                    AS total_count,
           COUNT(*) FILTER (WHERE level = 'info')     AS info_count,
           COUNT(*) FILTER (WHERE level = 'warn')     AS warn_count,
           COUNT(*) FILTER (WHERE level = 'error')    AS error_count
         FROM base
       )
       SELECT b.*, stats.total_count, stats.info_count, stats.warn_count, stats.error_count
       FROM (SELECT * FROM base ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}) b
       CROSS JOIN stats`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)],
    )

    const rows = result.rows
    const agg = rows[0] ?? { total_count: 0, info_count: 0, warn_count: 0, error_count: 0 }

    return reply.send({
      logs: rows.map(({ total_count, info_count, warn_count, error_count, ...row }) => row),
      total: parseInt(agg.total_count, 10),
      stats: {
        total_count: agg.total_count,
        info_count:  agg.info_count,
        warn_count:  agg.warn_count,
        error_count: agg.error_count,
      },
    })
  })

  app.get('/api/logs/events', async (_request, reply) => {
    const result = await pool.query(`SELECT DISTINCT event FROM logs ORDER BY event`)
    return reply.send(result.rows.map((r) => r.event))
  })
}
