import { env } from 'cloudflare:test'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import app from '../../src'
import { authHeaders, jsonAuthHeaders, TEST_SESSION, TEST_USER } from '../helpers/auth'
import { makeInterview, resetFactories } from '../helpers/factories'

const {
  mockGetSession,
  mockGetInterviews,
  mockCreateInterview,
  mockDeleteInterview,
  mockDb,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetInterviews: vi.fn(),
  mockCreateInterview: vi.fn(),
  mockDeleteInterview: vi.fn(),
  mockDb: { destroy: vi.fn() },
}))

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

vi.mock('@/routes/interviews/db-queries', () => ({
  getInterviews: mockGetInterviews,
  createInterview: mockCreateInterview,
  deleteInterview: mockDeleteInterview,
  findInterviewBySessionId: vi.fn(),
  cleanupInstantInterviews: vi.fn(),
}))

describe('get /interviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactories()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
  })

  it('returns interviews for the authenticated user', async () => {
    const interview = makeInterview()
    mockGetInterviews.mockResolvedValue([interview])

    const res = await app.request('/interviews', {
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.interviews).toHaveLength(1)
  })

  it('returns empty array when user has no interviews', async () => {
    mockGetInterviews.mockResolvedValue([])

    const res = await app.request('/interviews', {
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.interviews).toEqual([])
  })

  it('calls getInterviews with correct filters', async () => {
    mockGetInterviews.mockResolvedValue([])

    await app.request('/interviews', {
      headers: authHeaders(),
    }, env)

    expect(mockGetInterviews).toHaveBeenCalledWith(
      expect.anything(), // db instance
      {
        userId: TEST_USER.id,
        userEmail: TEST_USER.email,
        onlyScheduledInterviews: true,
      },
    )
  })
})

describe('post /interviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactories()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
    mockCreateInterview.mockResolvedValue('generated-session-uuid')
  })

  it('creates an interview and returns sessionId with 201', async () => {
    const res = await app.request('/interviews', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        hostId: TEST_USER.id,
        startTime: '2026-04-01T10:00:00Z',
        endTime: '2026-04-01T11:00:00Z',
        isInstant: false,
      }),
    }, env)

    expect(res.status).toBe(201)
    const body = await res.json<any>()
    expect(body.sessionId).toBe('generated-session-uuid')
  })

  it('creates an interview with invites', async () => {
    const res = await app.request('/interviews', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        hostId: TEST_USER.id,
        startTime: '2026-04-01T10:00:00Z',
        endTime: '2026-04-01T11:00:00Z',
        isInstant: false,
        invites: [
          { email: 'candidate@example.com', isInterviewer: false },
        ],
      }),
    }, env)

    expect(res.status).toBe(201)
    // verify createInterview was called with the invites + host added
    expect(mockCreateInterview).toHaveBeenCalledWith(
      expect.anything(),
      TEST_USER.id,
      expect.any(Date),
      expect.any(Date),
      false,
      expect.arrayContaining([
        { email: 'candidate@example.com', isInterviewer: false },
        { email: TEST_USER.email, isInterviewer: true },
      ]),
    )
  })

  it('rejects self-invite with 400', async () => {
    const res = await app.request('/interviews', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        hostId: TEST_USER.id,
        startTime: '2026-04-01T10:00:00Z',
        endTime: '2026-04-01T11:00:00Z',
        isInstant: false,
        invites: [
          { email: TEST_USER.email, isInterviewer: false },
        ],
      }),
    }, env)

    expect(res.status).toBe(400)
    const body = await res.json<any>()
    expect(body.error).toContain('invite yourself')
  })

  it('rejects self-invite regardless of email case', async () => {
    const res = await app.request('/interviews', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        hostId: TEST_USER.id,
        startTime: '2026-04-01T10:00:00Z',
        endTime: '2026-04-01T11:00:00Z',
        isInstant: false,
        invites: [
          { email: TEST_USER.email.toUpperCase(), isInterviewer: false },
        ],
      }),
    }, env)

    expect(res.status).toBe(400)
    const body = await res.json<any>()
    expect(body.error).toContain('invite yourself')
  })

  it('rejects duplicate invite emails with 400', async () => {
    const res = await app.request('/interviews', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        hostId: TEST_USER.id,
        startTime: '2026-04-01T10:00:00Z',
        endTime: '2026-04-01T11:00:00Z',
        isInstant: false,
        invites: [
          { email: 'duplicate@example.com', isInterviewer: false },
          { email: 'duplicate@example.com', isInterviewer: true },
        ],
      }),
    }, env)

    expect(res.status).toBe(400)
    const body = await res.json<any>()
    expect(body.error).toContain('unique')
  })

  it('returns 400 for missing required fields', async () => {
    const res = await app.request('/interviews', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({}),
    }, env)

    expect(res.status).toBe(400)
  })
})

describe('delete /interviews/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactories()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
  })

  it('deletes an interview when user is host', async () => {
    const interview = makeInterview({ id: 5, hostId: TEST_USER.id })
    mockGetInterviews.mockResolvedValue([interview])
    mockDeleteInterview.mockResolvedValue(undefined)

    const res = await app.request('/interviews/5', {
      method: 'DELETE',
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(204)
    expect(mockDeleteInterview).toHaveBeenCalledWith(expect.anything(), 5)
  })

  it('returns 404 when interview not found', async () => {
    mockGetInterviews.mockResolvedValue([])

    const res = await app.request('/interviews/999', {
      method: 'DELETE',
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(404)
  })

  it('returns 403 when user is not the host', async () => {
    // user is invited (so getInterviews returns it) but not the host
    const interview = makeInterview({ id: 5, hostId: 'other-user-id' })
    mockGetInterviews.mockResolvedValue([interview])

    const res = await app.request('/interviews/5', {
      method: 'DELETE',
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(403)
  })

  it('returns 400 for non-integer id', async () => {
    const res = await app.request('/interviews/abc', {
      method: 'DELETE',
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(400)
  })
})
