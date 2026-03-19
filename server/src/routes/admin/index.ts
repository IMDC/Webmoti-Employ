import type { AppContext } from '../..'
import { NewInterviewInvite } from '@webmoti-employ/shared'
import { Hono } from 'hono'
import { z } from 'zod'
import { useAdmin } from '../../middleware/useAdmin'
import { requireDb, useDb } from '../../middleware/useDb'
import { getAdminEmails } from '../../utils/admin-emails'
import { zValidator } from '../../utils/validator-wrapper'
import { createInterview, deleteInterview, getInterviews } from '../interviews/db-queries'
import { generateZoomApiJwt } from '../sessions/jwt'
import { ZoomClient } from '../sessions/ZoomClient'
import { addToAllowlist, deleteUser, getAllowlist, getAllUsers, removeFromAllowlist } from './db-queries'

const adminRoute = new Hono<AppContext>()

// accessible to any authenticated user (returns whether the user is an admin)
// registered before useDb since it doesn't need a DB connection
adminRoute.get('/check', (c) => {
  const user = c.var.user
  const adminEmails = getAdminEmails(c.env.ADMIN_EMAILS)
  const isAdmin = adminEmails.includes(user.email.toLowerCase())
  return c.json({ isAdmin })
})

// all routes below require DB and admin
adminRoute.use(useDb)
adminRoute.use(useAdmin)

// ── Overview Stats ─────────────────────────────────────────

adminRoute.get('/overview', async (c) => {
  const db = requireDb(c)
  const adminEmails = getAdminEmails(c.env.ADMIN_EMAILS)

  const [userCountResult, interviewCountResult, allowlistCountResult, adminOverlapResult, recentInterviews, upcomingInterviews] = await Promise.all([
    db.selectFrom('user').select(db.fn.countAll<string>().as('count')).executeTakeFirstOrThrow(),
    db.selectFrom('interview').select(db.fn.countAll<string>().as('count')).executeTakeFirstOrThrow(),
    db.selectFrom('allowlist').select(db.fn.countAll<string>().as('count')).executeTakeFirstOrThrow(),
    // count admin emails already in the allowlist to avoid double-counting
    adminEmails.length > 0
      ? db.selectFrom('allowlist').select(db.fn.countAll<string>().as('count')).where('email', 'in', adminEmails).executeTakeFirstOrThrow()
      : Promise.resolve({ count: '0' }),
    db.selectFrom('interview')
      .innerJoin('user', 'user.id', 'interview.hostId')
      .select([
        'interview.id as id',
        'interview.hostId as hostId',
        'interview.startTime as startTime',
        'interview.isInstant as isInstant',
        'user.name as hostName',
      ])
      .where('interview.startTime', '<=', new Date())
      .orderBy('interview.startTime', 'desc')
      .limit(5)
      .execute(),
    db.selectFrom('interview')
      .innerJoin('user', 'user.id', 'interview.hostId')
      .select([
        'interview.id as id',
        'interview.hostId as hostId',
        'interview.startTime as startTime',
        'interview.isInstant as isInstant',
        'user.name as hostName',
      ])
      .where('interview.startTime', '>', new Date())
      .orderBy('interview.startTime', 'asc')
      .limit(5)
      .execute(),
  ])

  // Get live session count
  let liveSessionCount = 0
  try {
    const apiToken = await generateZoomApiJwt(c.env.ZOOM_API_KEY, c.env.ZOOM_API_SECRET)
    const client = new ZoomClient(apiToken)
    const sessions = await client.getAllLiveSessions()
    liveSessionCount = sessions.length
  }
  catch {
    // Zoom API may be unavailable, continue with 0
  }

  return c.json({
    stats: {
      totalUsers: Number(userCountResult.count),
      totalInterviews: Number(interviewCountResult.count),
      allowlistSize: Number(allowlistCountResult.count) + adminEmails.length - Number(adminOverlapResult.count),
      liveSessionCount,
    },
    recentInterviews: recentInterviews.map(i => ({
      id: i.id,
      hostId: i.hostId,
      hostName: i.hostName,
      startTime: i.startTime,
      isInstant: i.isInstant,
    })),
    upcomingInterviews: upcomingInterviews.map(i => ({
      id: i.id,
      hostId: i.hostId,
      hostName: i.hostName,
      startTime: i.startTime,
      isInstant: i.isInstant,
    })),
  })
})

// ── Allowlist ──────────────────────────────────────────────

adminRoute.get('/allowlist', async (c) => {
  const db = requireDb(c)
  const adminEmails = getAdminEmails(c.env.ADMIN_EMAILS)
  const allowlist = await getAllowlist(db)
  return c.json({ allowlist, adminEmails })
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
    const deleted = await removeFromAllowlist(db, id)
    if (!deleted) {
      return c.json({ error: 'Allowlist entry not found' }, 404)
    }
    return c.body(null, 204)
  },
)

// ── Users ──────────────────────────────────────────────────

adminRoute.get('/users', async (c) => {
  const db = requireDb(c)
  const adminEmails = getAdminEmails(c.env.ADMIN_EMAILS)
  const users = await getAllUsers(db)
  return c.json({ users, adminEmails })
})

adminRoute.delete(
  '/users/:id',
  zValidator('param', z.object({ id: z.string() })),
  async (c) => {
    const db = requireDb(c)
    const { id } = c.req.valid('param')

    // prevent admin from deleting themselves
    if (id === c.var.user.id) {
      return c.json({ error: 'Cannot delete yourself' }, 400)
    }

    // prevent deleting other admins
    const adminEmails = getAdminEmails(c.env.ADMIN_EMAILS)
    const allUsers = await getAllUsers(db)
    const targetUser = allUsers.find(u => u.id === id)
    if (targetUser && adminEmails.includes(targetUser.email.toLowerCase())) {
      return c.json({ error: 'Cannot delete an admin user' }, 403)
    }

    const deleted = await deleteUser(db, id)
    if (!deleted) {
      return c.json({ error: 'User not found' }, 404)
    }
    return c.body(null, 204)
  },
)

// ── Interviews ─────────────────────────────────────────────

adminRoute.get('/interviews', async (c) => {
  const db = requireDb(c)
  const interviews = await getInterviews(db)
  const users = await getAllUsers(db)

  // enrich invites with user names where available
  const userMap = new Map(users.map(u => [u.email.toLowerCase(), u]))
  const hostMap = new Map(users.map(u => [u.id, u]))
  const enriched = interviews.map((interview) => {
    const host = hostMap.get(interview.hostId)
    return {
      ...interview,
      hostName: host?.name ?? null,
      hostEmail: host?.email ?? null,
      invites: interview.invites.map(invite => ({
        ...invite,
        name: userMap.get(invite.email.toLowerCase())?.name ?? null,
        userId: userMap.get(invite.email.toLowerCase())?.id ?? null,
      })),
    }
  })

  return c.json({ interviews: enriched })
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

    const interview = await db.selectFrom('interview')
      .select('id')
      .where('id', '=', id)
      .executeTakeFirst()

    if (!interview) {
      return c.json({ error: 'Interview not found' }, 404)
    }

    await deleteInterview(db, id)
    return c.body(null, 204)
  },
)

// ── Live Sessions ──────────────────────────────────────────

adminRoute.get('/live-sessions', async (c) => {
  let sessions: Awaited<ReturnType<ZoomClient['getAllLiveSessions']>>
  try {
    const apiToken = await generateZoomApiJwt(c.env.ZOOM_API_KEY, c.env.ZOOM_API_SECRET)
    const client = new ZoomClient(apiToken)
    sessions = await client.getAllLiveSessions()
  }
  catch {
    return c.json({ error: 'Failed to fetch live sessions from Zoom' }, 502)
  }

  // Enrich with interview data by matching session_name to interview sessionId
  const db = requireDb(c)
  const sessionNames = sessions.map(s => s.session_name)
  const interviews = sessionNames.length > 0
    ? await db.selectFrom('interview')
        .select(['id', 'sessionId', 'hostId'])
        .where('sessionId', 'in', sessionNames)
        .execute()
    : []

  const interviewMap = new Map(interviews.map(i => [i.sessionId, i]))

  const enriched = sessions.map((s) => {
    const interview = interviewMap.get(s.session_name)
    return {
      ...s,
      interviewId: interview?.id ?? null,
    }
  })

  return c.json({ sessions: enriched })
})

// ── Session History ────────────────────────────────────────

adminRoute.get('/session-history', async (c) => {
  const from = c.req.query('from')
  const to = c.req.query('to')
  if (!from || !to) {
    return c.json({ error: 'Missing required query params: from, to (yyyy-mm-dd)' }, 400)
  }

  let pastSessions: Awaited<ReturnType<ZoomClient['getPastSessions']>>
  try {
    const apiToken = await generateZoomApiJwt(c.env.ZOOM_API_KEY, c.env.ZOOM_API_SECRET)
    const client = new ZoomClient(apiToken)
    pastSessions = await client.getPastSessions(from, to)
  }
  catch {
    return c.json({ error: 'Failed to fetch session history from Zoom' }, 502)
  }

  // Enrich with interview data by matching session_key to interview sessionId
  const db = requireDb(c)
  const sessionKeys = pastSessions.sessions.map(s => s.session_key).filter(Boolean)
  const interviews = sessionKeys.length > 0
    ? await db.selectFrom('interview')
        .select(['id', 'sessionId'])
        .where('sessionId', 'in', sessionKeys)
        .execute()
    : []

  const interviewMap = new Map(interviews.map(i => [i.sessionId, i]))

  const enriched = pastSessions.sessions.map((s) => {
    const interview = interviewMap.get(s.session_key)
    return {
      ...s,
      interviewId: interview?.id ?? null,
    }
  })

  return c.json({ sessions: enriched, from: pastSessions.from, to: pastSessions.to })
})

adminRoute.get('/session-history/:sessionId/participants', async (c) => {
  const sessionId = c.req.param('sessionId')

  try {
    const apiToken = await generateZoomApiJwt(c.env.ZOOM_API_KEY, c.env.ZOOM_API_SECRET)
    const client = new ZoomClient(apiToken)
    const users = await client.getSessionUsers(sessionId)

    // Zoom participant name is set to user.id when joining - look up real names
    const userIds = users.map(u => u.name).filter(Boolean)
    const db = requireDb(c)
    const dbUsers = userIds.length > 0
      ? await db.selectFrom('user').select(['id', 'name', 'email', 'image']).where('id', 'in', userIds).execute()
      : []
    const userMap = new Map(dbUsers.map(u => [u.id, u]))

    const enriched = users.map((u) => {
      const dbUser = userMap.get(u.name)
      return {
        ...u,
        userName: dbUser?.name ?? null,
        userEmail: dbUser?.email ?? null,
        userImage: dbUser?.image ?? null,
      }
    })

    return c.json({ participants: enriched })
  }
  catch {
    return c.json({ error: 'Failed to fetch session participants from Zoom' }, 502)
  }
})

export default adminRoute
