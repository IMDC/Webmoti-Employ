import type { ProfilesResponse } from '@webmoti-employ/shared'
import type { AppContext } from '@/index'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireDb, useDb } from '@/middleware/useDb'
import { getProfilesByEmails, getProfilesByIds } from './db-queries'

const profilesRoute = new Hono<AppContext>()

const GetProfiles = z.object({
  userIds: z.array(z.string()).optional(),
  userEmails: z.array(z.email()).optional(),
}).check((ctx) => {
  const { userIds, userEmails } = ctx.value
  if (!userIds?.length && !userEmails?.length) {
    ctx.issues.push({
      code: 'custom',
      message: 'At least one of userIds or userEmails must be provided.',
      input: ctx.value,
    })
  }
})

profilesRoute.post('/', zValidator('json', GetProfiles), useDb, async (c) => {
  const { userIds = [], userEmails = [] } = c.req.valid('json')
  const db = requireDb(c)

  const results: ProfilesResponse = {}

  const usersById = await getProfilesByIds(db, userIds)
  for (const user of usersById) {
    results[user.id] = {
      displayName: user.name,
      profilePic: user.image || '',
    }
  }

  const usersByEmail = await getProfilesByEmails(db, userEmails)
  for (const user of usersByEmail) {
    results[user.email] = {
      displayName: user.name,
      profilePic: user.image || '',
    }
  }

  return c.json(results)
})

export default profilesRoute
