import type { AppContext } from '@/index'
import { Hono } from 'hono'
import { getAuth } from '@/lib/getAuth'

const authRoute = new Hono<AppContext>()

authRoute.on(['GET', 'POST'], '/*', (c) => {
  return getAuth(c.env).handler(c.req.raw)
})

export default authRoute
