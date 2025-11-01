import type { AppContext } from '../..'
import { NewInterview, NewInterviewInvite } from '@webmoti-employ/shared'

import { Hono } from 'hono'
import z from 'zod'
import { requireDb, useDb } from '../../middleware/useDb'
import { zValidator } from '../../validator-wrapper'
import { createInterview, getInterviews } from './db-queries'

const interviewsRoute = new Hono<AppContext>()
interviewsRoute.use(useDb)

interviewsRoute.get('/', async (c) => {
  const db = requireDb(c)
  const user = c.var.user
  const userEmail = user.email.toLowerCase()

  const interviewRows = await getInterviews(
    db,
    {
      userId: user.id,
      userEmail,
      onlyScheduledInterviews: true,
    },
  )

  return c.json({ interviews: interviewRows })
})

export const PostNewInterview = NewInterview.extend({
  invites: z.array(NewInterviewInvite).optional(),
})

interviewsRoute.post('/', zValidator('json', PostNewInterview), async (c) => {
  const db = requireDb(c)
  const user = c.var.user
  const data = c.req.valid('json')

  const userEmail = user.email.toLowerCase()
  const invitedSelf = (data.invites || []).some(invite => invite.email.toLowerCase() === userEmail)
  if (invitedSelf) {
    return c.json({ error: 'You cannot invite yourself' }, 400)
  }

  // add creator as participant
  const invites: NewInterviewInvite[] = [
    ...data.invites || [],
    {
      email: userEmail,
      isInterviewer: true,
    },
  ]

  // no duplicate invites allowed
  const emails = invites.map(i => i.email.toLowerCase())
  const uniqueEmails = new Set(emails)
  if (emails.length !== uniqueEmails.size) {
    return c.json({ error: 'Invite emails must be unique' }, 400)
  }

  const sessionId = await createInterview(
    db,
    data.creatorId,
    data.startTime,
    data.endTime,
    false,
    invites,
  )

  return c.json({ sessionId }, 201)
})

export default interviewsRoute
