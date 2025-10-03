import type { AppContext } from '..'
import { createMiddleware } from 'hono/factory'
import { getAuth } from '@/lib/getAuth'

export const useQueryAuth = createMiddleware<AppContext>(async (c, next) => {
  const token = c.req.query('token')
  if (!token)
    return c.json({ error: 'Unauthorized' }, 401)

  const headers = new Headers()
  headers.set('Authorization', `Bearer ${token}`)

  const session = await getAuth(c.env).api.getSession({ headers })
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('user', session.user)
  c.set('session', session.session)
  return next()
})
