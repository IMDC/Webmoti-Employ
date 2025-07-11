import type { AppContext } from '../..'
import { NewInterview } from '@web-employ/shared'
import { Hono } from 'hono'
import { requireDb, useDb } from '../../middleware/useDb'
import { requireUserEmail, useUserEmail } from '../../middleware/useUserEmail'
import { zValidator } from '../../validator-wrapper'
import { createInterview, deleteInterview, getInterviews } from './db-queries'
import { InterviewsDeleteRequest } from './schema'

const interviewsRoute = new Hono<AppContext>()
interviewsRoute.use('*', useDb)

interviewsRoute.get('/', useUserEmail, async (c) => {
  const db = requireDb(c)
  const userEmail = requireUserEmail(c)

  const interviewRows = await getInterviews(db, c.var.clerkUserId, userEmail)

  function nestInterviews(rows: typeof interviewRows) {
    const map = new Map<
      number,
      {
        id: number
        creatorId: string
        startTime: Date
        endTime: Date
        sessionId: string
        invites: { id: number, interviewId: number, email: string }[]
      }
    >()

    for (const row of rows) {
      let interview = map.get(row.interviewId)
      if (!interview) {
        interview = {
          id: row.interviewId,
          creatorId: row.creatorId,
          startTime: row.startTime,
          endTime: row.endTime,
          sessionId: row.sessionId,
          invites: [],
        }
        map.set(row.interviewId, interview)
      }

      if (row.inviteId && row.inviteEmail) {
        interview.invites.push({
          id: row.inviteId,
          interviewId: row.interviewId,
          email: row.inviteEmail,
        })
      }
    }

    return Array.from(map.values())
  }

  return c.json({ interviews: nestInterviews(interviewRows) })
})

interviewsRoute.post('/', zValidator('json', NewInterview), async (c) => {
  const db = requireDb(c)
  const data = c.req.valid('json')

  await createInterview(db, data.creatorId, data.startTime, data.endTime, data.invites)

  return c.json({ message: 'Interview created' }, 201)
})

interviewsRoute.delete('/:id', zValidator('param', InterviewsDeleteRequest), async (c) => {
  const db = requireDb(c)
  const { id } = c.req.valid('param')

  await deleteInterview(db, id)

  return c.body(null, 204)
})

// interviewsRoute.patch("/", (c) => {
//   return c.text("Hello Hono!");
// });

export default interviewsRoute
