import { env } from 'cloudflare:test'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import app from '../../src'
import { authHeaders, TEST_SESSION, TEST_USER } from '../helpers/auth'
import { makeInterview } from '../helpers/factories'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

const {
  mockGetSession,
  mockCreateInterview,
  mockFindInterviewBySessionId,
  mockGenerateZoomVideoJwt,
  mockGenerateZoomApiJwt,
  mockSearchLiveSessions,
  mockDb,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockCreateInterview: vi.fn(),
  mockFindInterviewBySessionId: vi.fn(),
  mockGenerateZoomVideoJwt: vi.fn(),
  mockGenerateZoomApiJwt: vi.fn(),
  mockSearchLiveSessions: vi.fn(),
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
  getInterviews: vi.fn(),
  createInterview: mockCreateInterview,
  findInterviewBySessionId: mockFindInterviewBySessionId,
  deleteInterview: vi.fn(),
  cleanupInstantInterviews: vi.fn(),
}))

vi.mock('@/routes/sessions/jwt', () => ({
  generateZoomVideoJwt: mockGenerateZoomVideoJwt,
  generateZoomApiJwt: mockGenerateZoomApiJwt,
}))

vi.mock('@/routes/sessions/ZoomClient', () => ({
  ZoomClient: vi.fn().mockImplementation(() => ({
    searchLiveSessions: mockSearchLiveSessions,
  })),
}))

describe('gET /sessions (create instant meeting)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
    mockCreateInterview.mockResolvedValue('new-session-uuid')
    mockGenerateZoomVideoJwt.mockResolvedValue('mock-video-jwt')
  })

  it('creates an instant meeting and returns sessionId + token', async () => {
    const res = await app.request('/sessions', {
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.sessionId).toBe('new-session-uuid')
    expect(body.token).toBe('mock-video-jwt')
  })

  it('creates the interview as instant with correct parameters', async () => {
    await app.request('/sessions', {
      headers: authHeaders(),
    }, env)

    expect(mockCreateInterview).toHaveBeenCalledWith(
      expect.anything(), // db
      TEST_USER.id,
      expect.any(Date), // current time
      null, // no end time for instant
      true, // isInstant
      [{ email: TEST_USER.email, isInterviewer: true }],
    )
  })

  it('generates JWT with host role (1)', async () => {
    await app.request('/sessions', {
      headers: authHeaders(),
    }, env)

    expect(mockGenerateZoomVideoJwt).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 1,
        sessionName: 'new-session-uuid',
        userIdentity: TEST_USER.id,
      }),
    )
  })
})

describe('gET /sessions/:sessionId (join session)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
    mockGenerateZoomVideoJwt.mockResolvedValue('mock-join-jwt')
    mockGenerateZoomApiJwt.mockResolvedValue('mock-api-jwt')
    mockSearchLiveSessions.mockResolvedValue([])
  })

  it('returns join token for scheduled interview when user is creator', async () => {
    const interview = makeInterview({
      sessionId: VALID_UUID,
      creatorId: TEST_USER.id,
    })
    mockFindInterviewBySessionId.mockResolvedValue(interview)

    const res = await app.request(`/sessions/${VALID_UUID}`, {
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.token).toBe('mock-join-jwt')
  })

  it('returns join token for scheduled interview when user is invited', async () => {
    const interview = makeInterview({
      sessionId: VALID_UUID,
      creatorId: 'other-user-id',
      invites: [
        { id: 1, interviewId: 1, email: TEST_USER.email, isInterviewer: false },
      ],
    })
    mockFindInterviewBySessionId.mockResolvedValue(interview)

    const res = await app.request(`/sessions/${VALID_UUID}`, {
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.token).toBe('mock-join-jwt')
  })

  it('returns 401 for scheduled non-instant interview when user has no access', async () => {
    const interview = makeInterview({
      sessionId: VALID_UUID,
      creatorId: 'other-user-id',
      isInstant: false,
      invites: [
        { id: 1, interviewId: 1, email: 'someone-else@example.com', isInterviewer: false },
      ],
    })
    mockFindInterviewBySessionId.mockResolvedValue(interview)

    const res = await app.request(`/sessions/${VALID_UUID}`, {
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(401)
  })

  it('allows joining live sessions not found in DB', async () => {
    mockFindInterviewBySessionId.mockResolvedValue(null)
    mockSearchLiveSessions.mockResolvedValue([
      {
        id: '1',
        session_name: VALID_UUID,
        session_key: VALID_UUID,
        start_time: new Date().toISOString(),
        end_time: '',
        user_count: 1,
      },
    ])

    const res = await app.request(`/sessions/${VALID_UUID}`, {
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.token).toBe('mock-join-jwt')
  })

  it('returns 404 when session not found in DB or live', async () => {
    mockFindInterviewBySessionId.mockResolvedValue(null)
    mockSearchLiveSessions.mockResolvedValue([])

    const res = await app.request(`/sessions/${VALID_UUID}`, {
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(404)
  })

  it('returns 500 when Zoom API check fails', async () => {
    mockFindInterviewBySessionId.mockResolvedValue(null)
    mockSearchLiveSessions.mockRejectedValue(new Error('Zoom API unavailable'))

    const res = await app.request(`/sessions/${VALID_UUID}`, {
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(500)
  })

  it('returns 400 for non-UUID sessionId', async () => {
    const res = await app.request('/sessions/not-a-uuid', {
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(400)
  })

  it('generates JWT with participant role (0) when joining', async () => {
    const interview = makeInterview({
      sessionId: VALID_UUID,
      creatorId: TEST_USER.id,
    })
    mockFindInterviewBySessionId.mockResolvedValue(interview)

    await app.request(`/sessions/${VALID_UUID}`, {
      headers: authHeaders(),
    }, env)

    expect(mockGenerateZoomVideoJwt).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 0,
      }),
    )
  })
})
