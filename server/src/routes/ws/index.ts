import type { AppContext } from '@/index'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import z from 'zod'
import { requireDb, useDb } from '@/middleware/useDb'
import { useQueryAuth } from '@/middleware/useQueryAuth'
import { getInterviews } from '../interviews/db-queries'

const wsRoute = new Hono<AppContext>()

wsRoute.use(useQueryAuth)
wsRoute.use(useDb)

const WsRequestQuery = z.object({
  token: z.string(),
  sessionId: z.string(),
})

wsRoute.get(
  '/',
  zValidator('query', WsRequestQuery),
  async (c) => {
    const { sessionId } = c.req.query()
    const db = requireDb(c)
    const user = c.var.user
    const userEmail = user.email.toLowerCase()

    const objectId = c.env.AI_ROOM.idFromName(sessionId)
    const durableObjectStub = c.env.AI_ROOM.get(objectId)

    // pass both userId and userEmail so both the creator and invited users can find the interview
    const interviews = await getInterviews(db, { userId: c.var.user.id, userEmail, sessionId })
    if (!interviews.length) {
      return c.json({ error: 'Interview not found' }, 404)
    }

    // assume since we're using sessionId there will be only 1 interview returned
    const invites = interviews[0].invites
    const isInterviewer = invites.find(i => i.email === userEmail)?.isInterviewer ?? false

    // create a new request with extra information included as headers
    const req = new Request(c.req.raw.url, {
      method: c.req.raw.method,
      headers: new Headers(c.req.raw.headers),
      body: c.req.raw.body,
    })
    // extra information
    req.headers.set('x-is-interviewer', String(isInterviewer))
    req.headers.set('x-name', user.name)

    // Forward that request to the Durable Object stub.
    return durableObjectStub.fetch(req)
  },
)

export default wsRoute
