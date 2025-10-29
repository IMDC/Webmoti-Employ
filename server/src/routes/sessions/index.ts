import type { AppContext } from '../..'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireDb, useDb } from '../../middleware/useDb'
import { zValidator } from '../../validator-wrapper'
import { createInterview, getUserInterviews } from '../interviews/db-queries'
import { generateZoomApiJwt, generateZoomVideoJwt } from './jwt'
import { ZoomClient } from './ZoomClient'

const sessionsRoute = new Hono<AppContext>()
sessionsRoute.use(useDb)

sessionsRoute.get('/', async (c) => {
  const db = requireDb(c)
  const user = c.var.user
  const userEmail = user.email.toLowerCase()
  const userIdentity = user.id

  // add instant meeting to database, making it a "joinable" meeting
  const sessionId = await createInterview(
    db,
    userIdentity,
    new Date(), // start time is current time
    null,
    true,
    [{ email: userEmail, isInterviewer: true }],
  )

  const token = await generateZoomVideoJwt({
    zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
    zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
    sessionName: sessionId,
    sessionKey: sessionId,
    userIdentity,
    role: 1,
  })

  return c.json({ sessionId, token })
})

const SessionsJoinRequestParams = z.object({
  sessionId: z.uuidv4(),
})

sessionsRoute.get(
  '/:sessionId',
  zValidator('param', SessionsJoinRequestParams),
  async (c) => {
    const { sessionId } = c.req.valid('param')

    const db = requireDb(c)
    const user = c.var.user
    const userEmail = user.email.toLowerCase()
    const userIdentity = user.id

    async function returnJoinToken() {
      const token = await generateZoomVideoJwt({
        zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
        zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
        sessionName: sessionId,
        sessionKey: sessionId,
        userIdentity,
        role: 0, // the person with role 1 is already in the session at this point
      })

      return c.json({ sessionId, token })
    }

    // ----------------------------------------------------
    // First check if this session is a scheduled session
    // ----------------------------------------------------

    const hasScheduledAccess = await getUserInterviews(
      db,
      {
        userId: user.id,
        userEmail,
        sessionId,
        isUpcoming: true,
      },
    )
    if (hasScheduledAccess.length > 0)
      return returnJoinToken()

    // check if user is unauthorized

    const scheduledButNotYou = await getUserInterviews(
      db,
      { sessionId, isUpcoming: true },
    )
    if (scheduledButNotYou.length)
      return c.json({ error: 'Unauthorized' }, 401)

    // ----------------------------------------------------
    // If not scheduled, check if live
    // ----------------------------------------------------

    const apiToken = await generateZoomApiJwt(c.env.ZOOM_API_KEY, c.env.ZOOM_API_SECRET)

    try {
      const client = new ZoomClient(apiToken)
      // this array should only be one session since we search using sessionId
      const liveSessions = await client.searchLiveSessions(sessionId)
      const isLive = liveSessions.some(
        s => s.session_name === sessionId && s.session_key === sessionId,
      )
      if (isLive) {
        return returnJoinToken()
      }
    }
    catch (error) {
      console.error('Zoom live session check failed:', error)
      return c.json({ error: 'Failed to query sessions' }, 500)
    }

    return c.json({ error: 'Unable to find session' }, 404)
  },
)

export default sessionsRoute
