import type { AppContext } from '..'
import { createMiddleware } from 'hono/factory'
import { getAuth } from '@/lib/getAuth'

export const useAuth = createMiddleware<AppContext>(async (c, next) => {
  const session = await getAuth(c.env).api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('user', session.user)
  c.set('session', session.session)
  return next()
})
