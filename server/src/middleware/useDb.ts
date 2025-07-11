import type { Context } from 'hono'
import type { Kysely } from 'kysely'
import type { AppContext } from '..'
import type { DB } from '../db/schema'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { getDb } from '../db/getDb'

export const useDb = createMiddleware<AppContext>(async (c, next) => {
  const db = getDb(c.env.HYPERDRIVE.connectionString)
  c.set('db', db)

  try {
    await next()
  }
  finally {
    c.executionCtx.waitUntil(db.destroy())
  }
})

export function requireDb(c: Context<AppContext>): Kysely<DB> {
  const db = c.var.db
  if (!db) {
    throw new HTTPException(500, { message: 'Database is missing from context' })
  }
  return db
}
