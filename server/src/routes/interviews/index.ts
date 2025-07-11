import type { DbInterview } from '@web-employ/shared'
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
    const interviewMap = new Map<number, DbInterview>()

    for (const row of rows) {
      let interview = interviewMap.get(row.id)
      // if this interview hasn't been added to the map yet
      if (!interview) {
        const { id, creatorId, startTime, endTime, sessionId } = row
        interview = { id, creatorId, startTime, endTime, sessionId, invites: [] }
        interviewMap.set(row.id, interview)
      }

      // then add the invite to the interview in the map
      if (row.inviteId && row.inviteEmail) {
        // interview either has an empty or non empty invites array at this point, so assert with !
        interview.invites!.push({ id: row.inviteId, interviewId: row.id, email: row.inviteEmail })
      }
    }

    return Array.from(interviewMap.values())
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
