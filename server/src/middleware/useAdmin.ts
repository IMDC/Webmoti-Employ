import type { AppContext } from '..'
import { createMiddleware } from 'hono/factory'

export const useAdmin = createMiddleware<AppContext>(async (c, next) => {
  const user = c.var.user
  const adminEmails = c.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) ?? []

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  return next()
})
