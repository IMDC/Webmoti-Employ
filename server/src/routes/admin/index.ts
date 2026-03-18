import type { AppContext } from '../..'
import { NewInterviewInvite } from '@webmoti-employ/shared'
import { Hono } from 'hono'
import { z } from 'zod'
import { useAdmin } from '../../middleware/useAdmin'
import { requireDb, useDb } from '../../middleware/useDb'
import { zValidator } from '../../utils/validator-wrapper'
import { createInterview, deleteInterview, getInterviews } from '../interviews/db-queries'
import { generateZoomApiJwt } from '../sessions/jwt'
import { ZoomClient } from '../sessions/ZoomClient'
import { addToAllowlist, getAllowlist, getAllUsers, removeFromAllowlist } from './db-queries'

const adminRoute = new Hono<AppContext>()
adminRoute.use(useDb)
adminRoute.use(useAdmin)

// ── Allowlist ──────────────────────────────────────────────

adminRoute.get('/allowlist', async (c) => {
  const db = requireDb(c)
  const allowlist = await getAllowlist(db)
  return c.json({ allowlist })
})

const AddAllowlistBody = z.object({
  email: z.email(),
})

adminRoute.post('/allowlist', zValidator('json', AddAllowlistBody), async (c) => {
  const db = requireDb(c)
  const { email } = c.req.valid('json')
  const user = c.var.user

  const entry = await addToAllowlist(db, email, user.id)
  return c.json({ entry }, 201)
})

adminRoute.delete(
  '/allowlist/:id',
  zValidator('param', z.object({ id: z.coerce.number().int() })),
  async (c) => {
    const db = requireDb(c)
    const { id } = c.req.valid('param')
    await removeFromAllowlist(db, id)
    return c.body(null, 204)
  },
)

// ── Users ──────────────────────────────────────────────────

adminRoute.get('/users', async (c) => {
  const db = requireDb(c)
  const users = await getAllUsers(db)
  return c.json({ users })
})

// ── Interviews ─────────────────────────────────────────────

adminRoute.get('/interviews', async (c) => {
  const db = requireDb(c)
  const interviews = await getInterviews(db)
  return c.json({ interviews })
})

const AdminNewInterview = z.object({
  hostId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().nullable(),
  isInstant: z.boolean(),
  invites: z.array(NewInterviewInvite).optional(),
})

adminRoute.post('/interviews', zValidator('json', AdminNewInterview), async (c) => {
  const db = requireDb(c)
  const data = c.req.valid('json')

  const invites = data.invites ?? []

  // no duplicate invites allowed
  const emails = invites.map(i => i.email.toLowerCase())
  const uniqueEmails = new Set(emails)
  if (emails.length !== uniqueEmails.size) {
    return c.json({ error: 'Invite emails must be unique' }, 400)
  }

  const sessionId = await createInterview(
    db,
    data.hostId,
    data.startTime,
    data.endTime,
    data.isInstant,
    invites,
  )

  return c.json({ sessionId }, 201)
})

adminRoute.delete(
  '/interviews/:id',
  zValidator('param', z.object({ id: z.coerce.number().int() })),
  async (c) => {
    const db = requireDb(c)
    const { id } = c.req.valid('param')

    const [interview] = await getInterviews(db)
      .then(interviews => interviews.filter(i => i.id === id))

    if (!interview) {
      return c.json({ error: 'Interview not found' }, 404)
    }

    await deleteInterview(db, id)
    return c.body(null, 204)
  },
)

// ── Live Sessions ──────────────────────────────────────────

adminRoute.get('/live-sessions', async (c) => {
  const apiToken = await generateZoomApiJwt(c.env.ZOOM_API_KEY, c.env.ZOOM_API_SECRET)
  const client = new ZoomClient(apiToken)
  const sessions = await client.getAllLiveSessions()
  return c.json({ sessions })
})

export default adminRoute
