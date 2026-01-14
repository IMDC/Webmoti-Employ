import type { SpeechmaticsResponse } from '@webmoti-employ/shared'
import type { AppContext } from '@/index'
import { createSpeechmaticsJWT } from '@speechmatics/auth'
import { Hono } from 'hono'

const speechmaticsRoute = new Hono<AppContext>()

speechmaticsRoute.post('/token', async (c) => {
  if (!c.env.SPEECHMATICS_API_KEY) {
    return c.json({ error: 'Speechmatics API key not configured.' }, 500)
  }

  try {
    // Generate a temporary JWT token (valid for 1 minute)
    const jwt = await createSpeechmaticsJWT({
      type: 'rt',
      apiKey: c.env.SPEECHMATICS_API_KEY,
      ttl: 60, // 1 minute
    })

    const result: SpeechmaticsResponse = { key: jwt }

    return c.json(result)
  }
  catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to generate Speechmatics JWT token.' }, 500)
  }
})

export default speechmaticsRoute
