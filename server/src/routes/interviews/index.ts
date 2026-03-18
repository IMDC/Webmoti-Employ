import type { AppContext } from '../..'
import { NewInterview, NewInterviewInvite } from '@webmoti-employ/shared'

import { Hono } from 'hono'
import z from 'zod'
import { requireDb, useDb } from '../../middleware/useDb'
import { zValidator } from '../../utils/validator-wrapper'
import { createInterview, deleteInterview, getInterviews } from './db-queries'

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

  // add host as participant
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
    data.hostId,
    data.startTime,
    data.endTime,
    false,
    invites,
  )

  return c.json({ sessionId }, 201)
})

interviewsRoute.delete(
  '/:id',
  zValidator('param', z.object({ id: z.coerce.number().int() })),
  async (c) => {
    const db = requireDb(c)
    const user = c.var.user
    const { id } = c.req.valid('param')

    // verify the user is the host
    const [interview] = await getInterviews(db, { userId: user.id })
      .then(interviews => interviews.filter(i => i.id === id))

    if (!interview) {
      return c.json({ error: 'Interview not found' }, 404)
    }

    if (interview.hostId !== user.id) {
      return c.json({ error: 'Only the host can delete an interview' }, 403)
    }

    await deleteInterview(db, id)
    return c.body(null, 204)
  },
)

export default interviewsRoute
