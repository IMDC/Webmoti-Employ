import type { Session, User } from 'better-auth'
import type { Kysely } from 'kysely'
import type { DB } from './db/schema'
import type { CloudflareBindings } from './types/env'
import { cloudflareRateLimiter } from '@hono-rate-limiter/cloudflare'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { AiRoom } from './durable-objects/ai-room'
import { useAuth } from './middleware/useAuth'
import authRoute from './routes/auth'
import interviewsRoute from './routes/interviews'
import profilesRoute from './routes/profiles'
import sessionsRoute from './routes/sessions'
import wsRoute from './routes/ws'

export interface AppContext {
  Bindings: CloudflareBindings
  Variables: {
    user: User
    session: Session
    db?: Kysely<DB>
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
  })
  return corsMiddleware(c, next)
})

app.use('/auth/*', cloudflareRateLimiter<AppContext>({
  rateLimitBinding: c => c.env.PUBLIC_RATE_LIMITER,
  keyGenerator: c => c.req.header('cf-connecting-ip') ?? '',
}))

// websocket can't authenticate with headers
app.route('/ws', wsRoute)

// the order matters, need to declare this before applying useAuth middleware
app.route('/auth', authRoute)

const protectedRoutes = new Hono<AppContext>()

// all routes except /auth require authentication
protectedRoutes.use(useAuth)

protectedRoutes.use(cloudflareRateLimiter<AppContext>({
  rateLimitBinding: c => c.env.USER_RATE_LIMITER,
  keyGenerator: c => c.var.user.id ?? '',
}))

protectedRoutes.route('/sessions', sessionsRoute)
protectedRoutes.route('/interviews', interviewsRoute)
protectedRoutes.route('/profiles', profilesRoute)
protectedRoutes.route('/ws', wsRoute)

app.route('/', protectedRoutes)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

app.notFound((c) => {
  return c.json({ error: `Route not found: ${c.req.method} ${c.req.path}` }, 404)
})

export { AiRoom }

export default app
