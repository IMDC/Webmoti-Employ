import type { Context } from 'hono'
import type { AppContext } from '..'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { getAuth } from '@/lib/getAuth'

export const useAuth = createMiddleware<AppContext>(async (c, next) => {
  const session = await getAuth(c.env).api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    c.set('user', null)
    c.set('session', null)
    return next()
  }

  c.set('user', session.user)
  c.set('session', session.session)
  return next()
})

export function requireAuth(c: Context<AppContext>) {
  const user = c.var.user
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }
  return user
}
