import type { Session, User } from 'better-auth'
import type { Kysely } from 'kysely'
import type { DB } from './db/schema'
import type { CloudflareBindings } from './types/env'
import { cloudflareRateLimiter } from '@hono-rate-limiter/cloudflare'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { useAuth } from './middleware/useAuth'
import authRoute from './routes/auth'
import interviewsRoute from './routes/interviews'
import profilesRoute from './routes/profiles'
import sessionsRoute from './routes/sessions'

export interface AppContext {
  Bindings: CloudflareBindings
  Variables: {
    user: User | null
    session: Session | null
    db?: Kysely<DB>
    userEmail?: string
  }
}

const app = new Hono<AppContext>()

app.use(async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.CORS_ORIGIN,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
  return corsMiddleware(c, next)
})

// all routes require authentication
app.use(useAuth)

// rate limit by user id and fallback to ip
app.use(
  cloudflareRateLimiter<AppContext>({
    rateLimitBinding: c => c.env.RATE_LIMITER,
    keyGenerator: c => c.var.user?.id ?? c.req.header('cf-connecting-ip') ?? '',
  }),
)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

app.notFound((c) => {
  return c.json({ error: `Route not found: ${c.req.method} ${c.req.path}` }, 404)
})

app.route('/sessions', sessionsRoute)
app.route('/interviews', interviewsRoute)
app.route('/profiles', profilesRoute)
app.route('/auth', authRoute)

export default app
