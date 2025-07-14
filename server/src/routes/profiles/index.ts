import type { ProfilesResponse } from '@web-employ/shared'
import type { AppContext } from '@/index'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

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

function getDisplayName(user: any, fallback: string): string {
  const first = user.firstName?.trim()
  const last = user.lastName?.trim()

  if (first && last)
    return `${first} ${last}`
  if (first)
    return first
  if (user.username)
    return user.username
  return user.emailAddresses?.[0]?.emailAddress || fallback
}

profilesRoute.post('/', zValidator('json', GetProfiles), async (c) => {
  const { userIds = [], userEmails = [] } = c.req.valid('json')
  const clerkClient = c.get('clerk')

  const results: ProfilesResponse = {}

  // fetch by id
  for (const userId of userIds) {
    try {
      const user = await clerkClient.users.getUser(userId)
      results[userId] = { displayName: getDisplayName(user, userId), profilePic: user.imageUrl }
    }
    catch {
      results[userId] = null
    }
  }

  // fetch by email
  for (const email of userEmails) {
    try {
      const users = await clerkClient.users.getUserList({ emailAddress: [email] })
      const user = users.data[0]
      results[email] = user
        ? { displayName: getDisplayName(user, email), profilePic: user.imageUrl }
        : null
    }
    catch {
      results[email] = null
    }
  }

  return c.json(results)
})

export default profilesRoute
