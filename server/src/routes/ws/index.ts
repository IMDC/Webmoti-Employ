import type { AppContext } from '@/index'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import z from 'zod'
import { useQueryAuth } from '@/middleware/useQueryAuth'

const wsRoute = new Hono<AppContext>()

wsRoute.use(useQueryAuth)

const WsRequestQuery = z.object({
  token: z.string(),
  room: z.string(),
})

wsRoute.get(
  '/',
  zValidator('query', WsRequestQuery),
  (c) => {
    const { room } = c.req.query()

    const objectId = c.env.AI_ROOM.idFromName(room)
    const durableObjectStub = c.env.AI_ROOM.get(objectId)

    // Forward the original request to the Durable Object stub.
    return durableObjectStub.fetch(c.req.raw)
  },
)

export default wsRoute
