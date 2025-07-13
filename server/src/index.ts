import type { Kysely } from 'kysely'
import type { DB } from './db/schema'
import { clerkMiddleware } from '@hono/clerk-auth'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { useAuth } from './middleware/useAuth'
import interviewsRoute from './routes/interviews'
import profilesRoute from './routes/profiles'
import sessionsRoute from './routes/sessions'

export interface AppContext {
  Bindings: CloudflareBindings
  Variables: {
    clerkUserId: string
    db?: Kysely<DB>
    userEmail?: string
  }
}

const app = new Hono<AppContext>()

app.use('*', cors())

// app.use('*', async (c, next) => {
//   const corsMiddleware = cors({
//     origin: c.env.CORS_ORIGIN,
//   })
//   return corsMiddleware(c, next)
// })

// all routes require authentication
app.use('*', clerkMiddleware())
app.use('*', useAuth)

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

export default app
