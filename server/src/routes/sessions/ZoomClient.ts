import { z } from 'zod'

const Session = z.object({
  id: z.string(),
  session_name: z.uuidv4(),
  session_key: z.uuidv4(),
  start_time: z.coerce.date(),
  // end_time will always be '' since we search for live sessions only
  end_time: z.literal(''),
  user_count: z.number(),
})

// eslint-disable-next-line ts/no-redeclare
export type Session = z.infer<typeof Session>

const SessionsGetRequest = z.object({
  sessions: z.array(Session),
})

const PastSession = z.object({
  id: z.string(),
  session_name: z.string(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  duration: z.string(),
  user_count: z.number(),
  has_voip: z.boolean(),
  has_video: z.boolean(),
  has_screen_share: z.boolean(),
  has_recording: z.boolean(),
  session_key: z.string(),
})

// eslint-disable-next-line ts/no-redeclare
export type PastSession = z.infer<typeof PastSession>

const PastSessionsResponse = z.object({
  from: z.string(),
  to: z.string(),
  sessions: z.array(PastSession),
  next_page_token: z.string().optional(),
})

const SessionUser = z.object({
  id: z.string(),
  name: z.string().optional().default(''),
  device: z.string().optional().default(''),
  ip_address: z.string().optional().default(''),
  location: z.string().optional().default(''),
  network_type: z.string().optional().default(''),
  data_center: z.string().optional().default(''),
  join_time: z.coerce.date(),
  leave_time: z.coerce.date(),
  user_key: z.string().optional().default(''),
  audio_quality: z.string().optional().default(''),
  video_quality: z.string().optional().default(''),
})

// eslint-disable-next-line ts/no-redeclare
export type SessionUser = z.infer<typeof SessionUser>

const SessionUsersResponse = z.object({
  users: z.array(SessionUser),
  next_page_token: z.string().optional(),
})

export class ZoomClient {
  private readonly base = 'https://api.zoom.us/v2/videosdk'
  constructor(private jwt: string) {}

  private async request(path: string, params?: URLSearchParams): Promise<unknown> {
    const url = `${this.base}${path}${params ? `?${params.toString()}` : ''}`

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.jwt}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Zoom API error: ${res.status} ${err}`)
    }

    return res.json()
  }

  async searchLiveSessions(sessionId: string) {
    const today = new Date().toISOString().slice(0, 10)
    const params = new URLSearchParams({
      type: 'live',
      from: today,
      to: today,
      session_name: sessionId,
      session_key: sessionId,
    })
    const data = await this.request('/sessions', params)
    const parsed = SessionsGetRequest.safeParse(data)
    if (!parsed.success) {
      throw new Error(z.prettifyError(parsed.error))
    }

    return parsed.data.sessions
  }

  async getAllLiveSessions() {
    const today = new Date().toISOString().slice(0, 10)
    const params = new URLSearchParams({
      type: 'live',
      from: today,
      to: today,
    })
    const data = await this.request('/sessions', params)
    const parsed = SessionsGetRequest.safeParse(data)
    if (!parsed.success) {
      throw new Error(z.prettifyError(parsed.error))
    }

    return parsed.data.sessions
  }

  async getPastSessions(from: string, to: string) {
    const params = new URLSearchParams({
      type: 'past',
      from,
      to,
      page_size: '300',
    })
    const data = await this.request('/sessions', params)
    const parsed = PastSessionsResponse.safeParse(data)
    if (!parsed.success) {
      throw new Error(z.prettifyError(parsed.error))
    }

    return parsed.data
  }

  async getSessionUsers(sessionId: string) {
    const params = new URLSearchParams({
      type: 'past',
      page_size: '300',
    })
    const data = await this.request(`/sessions/${encodeURIComponent(sessionId)}/users`, params)
    const parsed = SessionUsersResponse.safeParse(data)
    if (!parsed.success) {
      throw new Error(z.prettifyError(parsed.error))
    }

    return parsed.data.users
  }
}
