// Vercel serverless entry point
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildApp } from '../src/app'

const app = buildApp()
const ready = app.ready()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ready
  app.server.emit('request', req, res)
}
