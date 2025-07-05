import { DbContext } from '..';
import { getDb } from './getDb';
import { createMiddleware } from 'hono/factory';

export const dbMiddleware = createMiddleware<DbContext>(async (c, next) => {
  const db = getDb(c.env.HYPERDRIVE.connectionString);

  c.set('db', db);

  try {
    await next();
  } finally {
    c.executionCtx.waitUntil(db.destroy());
  }
});
