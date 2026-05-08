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

    const [rows, countRow, stats] = await Promise.all([
      pool.query(
        `SELECT id, level, event, message, product_id, product_title, details, created_at
         FROM logs ${where}
         ORDER BY created_at DESC
         LIMIT $${i} OFFSET $${i + 1}`,
        [...params, parseInt(limit, 10), parseInt(offset, 10)],
      ),
      pool.query(`SELECT COUNT(*) FROM logs ${where}`, params),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE level = 'info')  AS info_count,
          COUNT(*) FILTER (WHERE level = 'warn')  AS warn_count,
          COUNT(*) FILTER (WHERE level = 'error') AS error_count,
          COUNT(*) AS total_count
        FROM logs ${where}
      `, params),
    ])

    return reply.send({
      logs: rows.rows,
      total: parseInt(countRow.rows[0].count, 10),
      stats: stats.rows[0],
    })
  })

  app.get('/api/logs/events', async (_request, reply) => {
    const result = await pool.query(
      `SELECT DISTINCT event FROM logs ORDER BY event`,
    )
    return reply.send(result.rows.map((r) => r.event))
  })
}
