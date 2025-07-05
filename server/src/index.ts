import { DB } from './db/schema';
import interviewsRoute from './routes/interviews';
import sessionsRoute from './routes/sessions';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import { Hono } from 'hono';
import { Kysely } from 'kysely';

export type BaseContext = {
  Bindings: CloudflareBindings;
};

export type DbContext = BaseContext & {
  Variables: {
    db: Kysely<DB>;
  };
};

const app = new Hono<BaseContext>();

app.use('*', clerkMiddleware());

// all routes require authentication
app.use('*', async (c, next) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  return next();
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

app.notFound((c) => {
  return c.json({ error: `Route not found: ${c.req.method} ${c.req.path}` }, 404);
});

app.route('/sessions', sessionsRoute);
app.route('/interviews', interviewsRoute);

export default app;
