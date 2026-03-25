import type { AppContext } from '@/index'
import { Hono } from 'hono'
import { getAuth } from '@/lib/getAuth'

const authRoute = new Hono<AppContext>()

authRoute.on(['GET', 'POST'], '/*', (c) => {
  // strip cookies since we use bearer tokens, not cookies for auth.
  const headers = new Headers(c.req.raw.headers)
  headers.delete('cookie')
  const request = new Request(c.req.raw, { headers })

  return getAuth(c.env).handler(request)
})

export default authRoute
