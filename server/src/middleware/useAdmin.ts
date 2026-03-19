import type { AppContext } from '..'
import { createMiddleware } from 'hono/factory'
import { getAdminEmails } from '../utils/admin-emails'

export const useAdmin = createMiddleware<AppContext>(async (c, next) => {
  const user = c.var.user
  const adminEmails = getAdminEmails(c.env.ADMIN_EMAILS)

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  return next()
})
