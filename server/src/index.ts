import { DB } from './db/schema';
import { useAuth } from './middleware/useAuth';
import interviewsRoute from './routes/interviews';
import sessionsRoute from './routes/sessions';
import { clerkMiddleware } from '@hono/clerk-auth';
import { Hono } from 'hono';
import { Kysely } from 'kysely';

export type AppContext = {
  Bindings: CloudflareBindings;
  Variables: {
    clerkUserId: string;
    db?: Kysely<DB>;
  };
};

const app = new Hono<AppContext>();

app.use('*', clerkMiddleware());

// all routes require authentication
app.use('*', useAuth);

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
