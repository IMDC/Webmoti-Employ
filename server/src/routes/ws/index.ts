import type { AppContext } from '@/index'
import { Hono } from 'hono'

const wsRoute = new Hono<AppContext>()

wsRoute.get(
  '/',
  (c) => {
    // Use a hardcoded name to create a consistent Durable Object ID.
    // This ensures all clients connect to the same 'global-chat-room' instance.
    const objectId = c.env.AI_ROOM.idFromName('global-chat-room')
    const durableObjectStub = c.env.AI_ROOM.get(objectId)

    // Forward the original request to the Durable Object stub.
    return durableObjectStub.fetch(c.req.raw)
  },
)

export default wsRoute
