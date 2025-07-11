import type { Context } from 'hono'
import type { AppContext } from '..'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

export const useUserEmail = createMiddleware<AppContext>(async (c, next) => {
  const clerkClient = c.get('clerk')
  const user = await clerkClient.users.getUser(c.get('clerkUserId'))

  const clerkUserEmail = user.primaryEmailAddress?.emailAddress

  if (!clerkUserEmail) {
    return c.json({ message: 'Email not found' }, 400)
  }

  c.set('userEmail', clerkUserEmail)
  await next()
})

export function requireUserEmail(c: Context<AppContext>): string {
  const userEmail = c.var.userEmail
  if (!userEmail) {
    throw new HTTPException(500, { message: 'User email is missing from context' })
  }
  return userEmail
}
