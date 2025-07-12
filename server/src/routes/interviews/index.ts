import type { DbInterview } from '@web-employ/shared'
import type { AppContext } from '../..'
import { NewInterview, NewInterviewInvite } from '@web-employ/shared'

import { Hono } from 'hono'
import z from 'zod'
import { requireDb, useDb } from '../../middleware/useDb'
import { requireUserEmail, useUserEmail } from '../../middleware/useUserEmail'
import { zValidator } from '../../validator-wrapper'
import { createInterview, getInterviews } from './db-queries'

const interviewsRoute = new Hono<AppContext>()
interviewsRoute.use('*', useDb)

interviewsRoute.get('/', useUserEmail, async (c) => {
  const db = requireDb(c)
  const userEmail = requireUserEmail(c)

  const interviewRows = await getInterviews(db, c.var.clerkUserId, userEmail)

  function nestInterviews(rows: typeof interviewRows) {
    const interviewMap = new Map<number, DbInterview>()

    for (const row of rows) {
      let interview = interviewMap.get(row.id)
      // if this interview hasn't been added to the map yet
      if (!interview) {
        const { id, creatorId, startTime, endTime, sessionId, createdAt, updatedAt } = row
        interview = { id, creatorId, startTime, endTime, sessionId, invites: [], createdAt, updatedAt }
        interviewMap.set(row.id, interview)
      }

      // then add the invite to the interview in the map
      if (row.inviteId && row.inviteEmail) {
        // interview either has an empty or non empty invites array at this point, so assert with !
        interview.invites!.push({
          id: row.inviteId,
          interviewId: row.id,
          email: row.inviteEmail,
          isInterviewer: row.inviteIsInterviewer ?? false,
          isInterviewCreator: row.inviteIsInterviewCreator ?? false,
        })
      }
    }

    return Array.from(interviewMap.values())
  }

  return c.json({ interviews: nestInterviews(interviewRows) })
})

export const PostNewInterviewInvite = NewInterviewInvite.omit({
  isInterviewCreator: true,
})
export const PostNewInterview = NewInterview.extend({
  invites: z.array(PostNewInterviewInvite).optional(),
})

interviewsRoute.post('/', zValidator('json', PostNewInterview), useUserEmail, async (c) => {
  const db = requireDb(c)
  const data = c.req.valid('json')

  const userEmail = requireUserEmail(c)
  const invitedSelf = (data.invites || []).some(
    invite => invite.email.toLowerCase() === userEmail.toLowerCase(),
  )
  if (invitedSelf) {
    return c.json({ error: 'You cannot invite yourself' }, 400)
  }

  // add creator as participant
  const invites: NewInterviewInvite[] = [
    ...data.invites || [],
    {
      email: userEmail,
      isInterviewer: true,
      isInterviewCreator: true,
    },
  ]

  // no duplicate invites allowed
  const emails = invites.map(i => i.email.toLowerCase())
  const uniqueEmails = new Set(emails)
  if (emails.length !== uniqueEmails.size) {
    return c.json({ error: 'Invite emails must be unique' }, 400)
  }

  await createInterview(db, data.creatorId, data.startTime, data.endTime, invites)

  return c.json({ message: 'Interview created' }, 201)
})

export default interviewsRoute
