import type { FastifyInstance } from 'fastify'
import pool from '../services/db'

export async function cleanupRoutes(app: FastifyInstance) {
  app.get('/api/cleanup', async (request, reply) => {
    if (request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const result = await pool.query(
      `DELETE FROM logs WHERE created_at < NOW() - INTERVAL '7 days'`,
    )

    return reply.send({ deleted: result.rowCount })
  })
}
