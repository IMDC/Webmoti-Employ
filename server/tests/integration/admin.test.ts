import { env } from 'cloudflare:test'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import app from '../../src'
import { authHeaders, jsonAuthHeaders, OTHER_USER, TEST_SESSION, TEST_USER } from '../helpers/auth'
import { makeInterview, resetFactories } from '../helpers/factories'

const ADMIN_EMAIL = TEST_USER.email

const {
  mockGetSession,
  // interview db-queries
  mockGetInterviews,
  mockCreateInterview,
  mockDeleteInterview,
  // admin db-queries
  mockGetAllowlist,
  mockAddToAllowlist,
  mockRemoveFromAllowlist,
  mockGetAllUsers,
  mockDeleteUser,
  mockGetUserEmail,
  mockDb,
  mockExecuteTakeFirst,
  mockExecuteTakeFirstOrThrow,
  mockExecute,
  // zoom
  mockGenerateZoomApiJwt,
  mockGetAllLiveSessions,
} = vi.hoisted(() => {
  const mockExecuteTakeFirst = vi.fn()
  const mockExecuteTakeFirstOrThrow = vi.fn()
  const mockExecute = vi.fn()
  // chainable query builder mock for direct db queries
  const queryChain: any = {}
  queryChain.select = vi.fn().mockReturnValue(queryChain)
  queryChain.where = vi.fn().mockReturnValue(queryChain)
  queryChain.innerJoin = vi.fn().mockReturnValue(queryChain)
  queryChain.orderBy = vi.fn().mockReturnValue(queryChain)
  queryChain.limit = vi.fn().mockReturnValue(queryChain)
  queryChain.executeTakeFirst = mockExecuteTakeFirst
  queryChain.executeTakeFirstOrThrow = mockExecuteTakeFirstOrThrow
  queryChain.execute = mockExecute

  const mockGetAllLiveSessions = vi.fn()

  return {
    mockGetSession: vi.fn(),
    mockGetInterviews: vi.fn(),
    mockCreateInterview: vi.fn(),
    mockDeleteInterview: vi.fn(),
    mockGetAllowlist: vi.fn(),
    mockAddToAllowlist: vi.fn(),
    mockRemoveFromAllowlist: vi.fn(),
    mockGetAllUsers: vi.fn(),
    mockDeleteUser: vi.fn(),
    mockGetUserEmail: vi.fn(),
    mockDb: {
      destroy: vi.fn(),
      selectFrom: vi.fn().mockReturnValue(queryChain),
      fn: {
        countAll: vi.fn().mockReturnValue({
          as: vi.fn().mockReturnValue('count_expression'),
        }),
      },
    },
    mockExecuteTakeFirst,
    mockExecuteTakeFirstOrThrow,
    mockExecute,
    mockGenerateZoomApiJwt: vi.fn().mockResolvedValue('mock-jwt-token'),
    mockGetAllLiveSessions,
  }
})

vi.mock('@/lib/getAuth', () => ({
  getAuth: () => ({
    api: { getSession: mockGetSession },
  }),
}))

vi.mock('@/middleware/useDb', () => ({
  useDb: async (c: any, next: any) => {
    c.set('db', mockDb)
    await next()
  },
  requireDb: () => mockDb,
}))

// mock useAdmin to allow the admin email through
vi.mock('@/middleware/useAdmin', () => ({
  useAdmin: async (c: any, next: any) => {
    const user = c.var.user
    if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    return next()
  },
}))

vi.mock('@/routes/interviews/db-queries', () => ({
  getInterviews: mockGetInterviews,
  createInterview: mockCreateInterview,
  deleteInterview: mockDeleteInterview,
  findInterviewBySessionId: vi.fn(),
  cleanupInstantInterviews: vi.fn(),
}))

vi.mock('@/routes/admin/db-queries', () => ({
  getAllowlist: mockGetAllowlist,
  addToAllowlist: mockAddToAllowlist,
  removeFromAllowlist: mockRemoveFromAllowlist,
  getAllUsers: mockGetAllUsers,
  deleteUser: mockDeleteUser,
  getUserEmail: mockGetUserEmail,
}))

vi.mock('@/routes/sessions/jwt', () => ({
  generateZoomApiJwt: mockGenerateZoomApiJwt,
}))

vi.mock('@/routes/sessions/ZoomClient', () => ({
  ZoomClient: vi.fn().mockImplementation(() => ({
    getAllLiveSessions: mockGetAllLiveSessions,
  })),
}))

// ── GET /admin/check ───────────────────────────────────────

describe('get /admin/check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns isAdmin true for admin user', async () => {
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })

    const res = await app.request('/admin/check', {
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.isAdmin).toBe(true)
  })

  it('returns isAdmin false for non-admin user', async () => {
    mockGetSession.mockResolvedValue({
      user: OTHER_USER,
      session: TEST_SESSION,
    })

    const res = await app.request('/admin/check', {
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.isAdmin).toBe(false)
  })
})

// ── GET /admin/allowlist ───────────────────────────────────

describe('get /admin/allowlist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
  })

  it('returns allowlist and admin emails', async () => {
    const mockEntries = [
      { id: 1, email: 'a@example.com', addedById: TEST_USER.id, createdAt: new Date() },
    ]
    mockGetAllowlist.mockResolvedValue(mockEntries)

    const res = await app.request('/admin/allowlist', {
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.allowlist).toHaveLength(1)
    expect(body.adminEmails).toContain(ADMIN_EMAIL)
  })

  it('returns 403 for non-admin user', async () => {
    mockGetSession.mockResolvedValue({
      user: OTHER_USER,
      session: TEST_SESSION,
    })

    const res = await app.request('/admin/allowlist', {
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(403)
  })
})

// ── POST /admin/allowlist ──────────────────────────────────

describe('post /admin/allowlist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
  })

  it('adds email to allowlist and returns 201', async () => {
    const entry = { id: 2, email: 'new@example.com', addedById: TEST_USER.id, createdAt: new Date() }
    mockAddToAllowlist.mockResolvedValue(entry)

    const res = await app.request('/admin/allowlist', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ email: 'new@example.com' }),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(201)
    const body = await res.json<any>()
    expect(body.entry.email).toBe('new@example.com')
    expect(mockAddToAllowlist).toHaveBeenCalledWith(expect.anything(), 'new@example.com', TEST_USER.id)
  })

  it('returns 400 for invalid email', async () => {
    const res = await app.request('/admin/allowlist', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ email: 'not-an-email' }),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(400)
  })
})

// ── DELETE /admin/allowlist/:id ────────────────────────────

describe('delete /admin/allowlist/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
  })

  it('removes entry and returns 204', async () => {
    mockRemoveFromAllowlist.mockResolvedValue(true)

    const res = await app.request('/admin/allowlist/1', {
      method: 'DELETE',
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(204)
    expect(mockRemoveFromAllowlist).toHaveBeenCalledWith(expect.anything(), 1)
  })

  it('returns 404 when entry does not exist', async () => {
    mockRemoveFromAllowlist.mockResolvedValue(false)

    const res = await app.request('/admin/allowlist/999', {
      method: 'DELETE',
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(404)
  })

  it('returns 400 for non-integer id', async () => {
    const res = await app.request('/admin/allowlist/abc', {
      method: 'DELETE',
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(400)
  })
})

// ── GET /admin/users ───────────────────────────────────────

describe('get /admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
  })

  it('returns all users', async () => {
    const users = [
      { id: TEST_USER.id, email: TEST_USER.email, name: TEST_USER.name, image: TEST_USER.image, createdAt: new Date() },
      { id: OTHER_USER.id, email: OTHER_USER.email, name: OTHER_USER.name, image: OTHER_USER.image, createdAt: new Date() },
    ]
    mockGetAllUsers.mockResolvedValue(users)

    const res = await app.request('/admin/users', {
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.users).toHaveLength(2)
  })
})

// ── DELETE /admin/users/:id ────────────────────────────────

describe('delete /admin/users/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
  })

  it('deletes user and returns 204', async () => {
    mockDeleteUser.mockResolvedValue(true)

    const res = await app.request(`/admin/users/${OTHER_USER.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(204)
    expect(mockDeleteUser).toHaveBeenCalledWith(expect.anything(), OTHER_USER.id)
  })

  it('returns 404 when user does not exist', async () => {
    mockDeleteUser.mockResolvedValue(false)

    const res = await app.request(`/admin/users/${OTHER_USER.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(404)
  })

  it('returns 400 when deleting yourself', async () => {
    const res = await app.request(`/admin/users/${TEST_USER.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(400)
    const body = await res.json<any>()
    expect(body.error).toContain('yourself')
  })
})

// ── GET /admin/interviews ──────────────────────────────────

describe('get /admin/interviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactories()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
  })

  it('returns enriched interviews with host and invite names', async () => {
    const interview = makeInterview({
      hostId: TEST_USER.id,
      invites: [
        { id: 1, interviewId: 1, email: TEST_USER.email, isInterviewer: true },
        { id: 2, interviewId: 1, email: OTHER_USER.email, isInterviewer: false },
      ],
    })
    mockGetInterviews.mockResolvedValue([interview])

    const users = [
      { id: TEST_USER.id, email: TEST_USER.email, name: TEST_USER.name, image: TEST_USER.image, createdAt: new Date() },
      { id: OTHER_USER.id, email: OTHER_USER.email, name: OTHER_USER.name, image: OTHER_USER.image, createdAt: new Date() },
    ]
    mockGetAllUsers.mockResolvedValue(users)

    const res = await app.request('/admin/interviews', {
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.interviews).toHaveLength(1)
    expect(body.interviews[0].hostName).toBe(TEST_USER.name)
    expect(body.interviews[0].hostEmail).toBe(TEST_USER.email)
    // invites should be enriched with names
    const hostInvite = body.interviews[0].invites.find((i: any) => i.email === TEST_USER.email)
    expect(hostInvite.name).toBe(TEST_USER.name)
    expect(hostInvite.userId).toBe(TEST_USER.id)
  })

  it('returns empty array when no interviews exist', async () => {
    mockGetInterviews.mockResolvedValue([])
    mockGetAllUsers.mockResolvedValue([])

    const res = await app.request('/admin/interviews', {
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.interviews).toEqual([])
  })

  it('calls getInterviews without user-scoped filters', async () => {
    mockGetInterviews.mockResolvedValue([])
    mockGetAllUsers.mockResolvedValue([])

    await app.request('/admin/interviews', {
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    // admin route calls getInterviews(db) with no filters
    expect(mockGetInterviews).toHaveBeenCalledWith(expect.anything())
  })
})

// ── POST /admin/interviews ─────────────────────────────────

describe('post /admin/interviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactories()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
    mockCreateInterview.mockResolvedValue('generated-session-uuid')
  })

  it('creates interview and returns 201', async () => {
    mockGetUserEmail.mockResolvedValueOnce(OTHER_USER.email)

    const res = await app.request('/admin/interviews', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        hostId: OTHER_USER.id,
        startTime: '2026-04-01T10:00:00Z',
        endTime: '2026-04-01T11:00:00Z',
        isInstant: false,
        invites: [
          { email: 'candidate@example.com', isInterviewer: false },
        ],
      }),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(201)
    const body = await res.json<any>()
    expect(body.sessionId).toBe('generated-session-uuid')
  })

  it('auto-adds host as interviewer participant', async () => {
    mockGetUserEmail.mockResolvedValueOnce(OTHER_USER.email)

    await app.request('/admin/interviews', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        hostId: OTHER_USER.id,
        startTime: '2026-04-01T10:00:00Z',
        endTime: '2026-04-01T11:00:00Z',
        isInstant: false,
        invites: [
          { email: 'candidate@example.com', isInterviewer: false },
        ],
      }),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    // host should be auto-added as interviewer
    expect(mockCreateInterview).toHaveBeenCalledWith(
      expect.anything(),
      OTHER_USER.id,
      expect.any(Date),
      expect.any(Date),
      false,
      [
        { email: 'candidate@example.com', isInterviewer: false },
        { email: OTHER_USER.email, isInterviewer: true },
      ],
    )
  })

  it('does not duplicate host if already in invite list', async () => {
    mockGetUserEmail.mockResolvedValueOnce(OTHER_USER.email)

    await app.request('/admin/interviews', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        hostId: OTHER_USER.id,
        startTime: '2026-04-01T10:00:00Z',
        endTime: '2026-04-01T11:00:00Z',
        isInstant: false,
        invites: [
          { email: OTHER_USER.email, isInterviewer: true },
          { email: 'candidate@example.com', isInterviewer: false },
        ],
      }),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    // host already in list, should not be added again
    expect(mockCreateInterview).toHaveBeenCalledWith(
      expect.anything(),
      OTHER_USER.id,
      expect.any(Date),
      expect.any(Date),
      false,
      [
        { email: OTHER_USER.email, isInterviewer: true },
        { email: 'candidate@example.com', isInterviewer: false },
      ],
    )
  })

  it('auto-adds host even with no explicit invites', async () => {
    mockGetUserEmail.mockResolvedValueOnce(OTHER_USER.email)

    await app.request('/admin/interviews', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        hostId: OTHER_USER.id,
        startTime: '2026-04-01T10:00:00Z',
        endTime: '2026-04-01T11:00:00Z',
        isInstant: false,
      }),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(mockCreateInterview).toHaveBeenCalledWith(
      expect.anything(),
      OTHER_USER.id,
      expect.any(Date),
      expect.any(Date),
      false,
      [{ email: OTHER_USER.email, isInterviewer: true }],
    )
  })

  it('returns 404 when host user not found', async () => {
    mockGetUserEmail.mockResolvedValueOnce(null)

    const res = await app.request('/admin/interviews', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        hostId: 'nonexistent-id',
        startTime: '2026-04-01T10:00:00Z',
        endTime: '2026-04-01T11:00:00Z',
        isInstant: false,
      }),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(404)
    const body = await res.json<any>()
    expect(body.error).toContain('Host')
  })

  it('rejects duplicate invite emails with 400', async () => {
    mockGetUserEmail.mockResolvedValueOnce(OTHER_USER.email)

    const res = await app.request('/admin/interviews', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        hostId: OTHER_USER.id,
        startTime: '2026-04-01T10:00:00Z',
        endTime: '2026-04-01T11:00:00Z',
        isInstant: false,
        invites: [
          { email: 'dup@example.com', isInterviewer: false },
          { email: 'dup@example.com', isInterviewer: true },
        ],
      }),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(400)
    const body = await res.json<any>()
    expect(body.error).toContain('unique')
  })

  it('returns 400 for missing required fields', async () => {
    const res = await app.request('/admin/interviews', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({}),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(400)
  })
})

// ── DELETE /admin/interviews/:id ───────────────────────────

describe('delete /admin/interviews/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactories()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
  })

  it('deletes interview and returns 204', async () => {
    mockExecuteTakeFirst.mockResolvedValue({ id: 7 })
    mockDeleteInterview.mockResolvedValue(undefined)

    const res = await app.request('/admin/interviews/7', {
      method: 'DELETE',
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(204)
    expect(mockDeleteInterview).toHaveBeenCalledWith(expect.anything(), 7)
  })

  it('returns 404 when interview not found', async () => {
    mockExecuteTakeFirst.mockResolvedValue(undefined)

    const res = await app.request('/admin/interviews/999', {
      method: 'DELETE',
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(404)
  })

  it('returns 400 for non-integer id', async () => {
    const res = await app.request('/admin/interviews/abc', {
      method: 'DELETE',
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(400)
  })
})

// ── GET /admin/overview ────────────────────────────────────

describe('get /admin/overview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
  })

  it('returns stats and interview lists', async () => {
    // count queries: user, interview, allowlist, admin overlap
    mockExecuteTakeFirstOrThrow
      .mockResolvedValueOnce({ count: '10' })
      .mockResolvedValueOnce({ count: '25' })
      .mockResolvedValueOnce({ count: '3' })
      .mockResolvedValueOnce({ count: '1' })

    const recentInterview = { id: 1, hostId: TEST_USER.id, startTime: new Date('2026-03-01'), isInstant: false, hostName: 'Test User' }
    const upcomingInterview = { id: 2, hostId: TEST_USER.id, startTime: new Date('2026-04-01'), isInstant: true, hostName: 'Test User' }

    // execute queries: recent interviews, upcoming interviews
    mockExecute
      .mockResolvedValueOnce([recentInterview])
      .mockResolvedValueOnce([upcomingInterview])

    mockGetAllLiveSessions.mockResolvedValue([{ session_name: 'session-1' }])

    const res = await app.request('/admin/overview', {
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.stats.totalUsers).toBe(10)
    expect(body.stats.totalInterviews).toBe(25)
    expect(body.stats.liveSessionCount).toBe(1)
    expect(body.recentInterviews).toHaveLength(1)
    expect(body.upcomingInterviews).toHaveLength(1)
  })

  it('returns 0 live sessions when Zoom API fails', async () => {
    mockExecuteTakeFirstOrThrow
      .mockResolvedValueOnce({ count: '0' })
      .mockResolvedValueOnce({ count: '0' })
      .mockResolvedValueOnce({ count: '0' })
      .mockResolvedValueOnce({ count: '0' })
    mockExecute
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    mockGetAllLiveSessions.mockRejectedValue(new Error('Zoom unavailable'))

    const res = await app.request('/admin/overview', {
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.stats.liveSessionCount).toBe(0)
  })
})

// ── GET /admin/live-sessions ───────────────────────────────

describe('get /admin/live-sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
  })

  it('returns enriched sessions with interview ids', async () => {
    mockGetAllLiveSessions.mockResolvedValue([
      { session_name: 'session-uuid-1', user_count: 3 },
      { session_name: 'session-uuid-2', user_count: 1 },
    ])
    // db query to match sessions to interviews
    mockExecute.mockResolvedValueOnce([
      { id: 5, sessionId: 'session-uuid-1', hostId: TEST_USER.id },
    ])

    const res = await app.request('/admin/live-sessions', {
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.sessions).toHaveLength(2)
    expect(body.sessions[0].interviewId).toBe(5)
    expect(body.sessions[1].interviewId).toBeNull()
  })

  it('returns empty array when no live sessions', async () => {
    mockGetAllLiveSessions.mockResolvedValue([])

    const res = await app.request('/admin/live-sessions', {
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.sessions).toEqual([])
  })

  it('returns 502 when Zoom API fails', async () => {
    mockGetAllLiveSessions.mockRejectedValue(new Error('Zoom unavailable'))

    const res = await app.request('/admin/live-sessions', {
      headers: authHeaders(),
    }, { ...env, ADMIN_EMAILS: ADMIN_EMAIL })

    expect(res.status).toBe(502)
    const body = await res.json<any>()
    expect(body.error).toContain('Zoom')
  })
})
