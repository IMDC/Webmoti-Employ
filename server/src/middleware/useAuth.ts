import type { AppContext } from '..'
import { createMiddleware } from 'hono/factory'
import { getAuth } from '@/lib/getAuth'

export const useAuth = createMiddleware<AppContext>(async (c, next) => {
  // remove cookie header since it causes bearer_token to be ignored
  const headers = new Headers(c.req.raw.headers)
  headers.delete('cookie')
  const session = await getAuth(c.env).api.getSession({ headers })

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('user', session.user)
  c.set('session', session.session)
  return next()
})
