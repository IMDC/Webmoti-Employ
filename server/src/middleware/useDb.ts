import { AppContext } from '..';
import { getDb } from '../db/getDb';
import { DB } from '../db/schema';
import { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { Kysely } from 'kysely';

export const useDb = createMiddleware<AppContext>(async (c, next) => {
  const db = getDb(c.env.HYPERDRIVE.connectionString);
  c.set('db', db);

  try {
    await next();
  } finally {
    c.executionCtx.waitUntil(db.destroy());
  }
});

export function requireDb(c: Context<AppContext>): Kysely<DB> {
  const db = c.var.db;
  if (!db) {
    throw new HTTPException(500, { message: 'Database is missing from context' });
  }
  return db;
}
