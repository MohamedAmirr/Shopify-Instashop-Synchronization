import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30_000,
})

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id          BIGSERIAL PRIMARY KEY,
      level       VARCHAR(10)  NOT NULL,
      event       VARCHAR(100) NOT NULL,
      message     TEXT         NOT NULL,
      product_id  BIGINT,
      product_title VARCHAR(500),
      details     JSONB,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS logs_created_at_idx ON logs (created_at DESC);
    CREATE INDEX IF NOT EXISTS logs_level_idx      ON logs (level);
    CREATE INDEX IF NOT EXISTS logs_event_idx      ON logs (event);
  `)
}

export default pool
