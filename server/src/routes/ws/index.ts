import type { AppContext } from '@/index'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import z from 'zod'
import { requireDb, useDb } from '@/middleware/useDb'
import { useQueryAuth } from '@/middleware/useQueryAuth'
import { findInterviewBySessionId } from '../interviews/db-queries'

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

    // find the interview without user scoping, then check access in code
    const interview = await findInterviewBySessionId(db, sessionId)
    if (!interview) {
      return c.json({ error: 'Interview not found' }, 404)
    }

    // for scheduled interviews, verify the user is the host or an invitee
    if (!interview.isInstant) {
      const isHost = interview.hostId === user.id
      const isInvited = interview.invites.some(i => i.email === userEmail)
      if (!isHost && !isInvited) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
    }

    const invites = interview.invites
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
    const response = await durableObjectStub.fetch(req)
    return response
  },
)

export default wsRoute
