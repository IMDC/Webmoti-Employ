import { env } from 'cloudflare:test'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import app from '../../src'
import { authHeaders, TEST_SESSION, TEST_USER } from '../helpers/auth'

const {
  mockGetSession,
  mockCreateSpeechmaticsJWT,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockCreateSpeechmaticsJWT: vi.fn(),
}))

vi.mock('@/lib/getAuth', () => ({
  getAuth: () => ({
    api: { getSession: mockGetSession },
  }),
}))

// mock useDb to prevent real DB connections from other routes loaded by app
vi.mock('@/middleware/useDb', () => ({
  useDb: async (c: any, next: any) => {
    c.set('db', { destroy: vi.fn() })
    await next()
  },
  requireDb: (c: any) => c?.var?.db ?? { destroy: vi.fn() },
}))

vi.mock('@speechmatics/auth', () => ({
  createSpeechmaticsJWT: mockCreateSpeechmaticsJWT,
}))

describe('post /speechmatics/token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
    mockCreateSpeechmaticsJWT.mockResolvedValue('mock-speechmatics-jwt')
  })

  it('returns a Speechmatics JWT token', async () => {
    const res = await app.request('/speechmatics/token', {
      method: 'POST',
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.key).toBe('mock-speechmatics-jwt')
  })

  it('generates JWT with correct parameters', async () => {
    await app.request('/speechmatics/token', {
      method: 'POST',
      headers: authHeaders(),
    }, env)

    expect(mockCreateSpeechmaticsJWT).toHaveBeenCalledWith({
      type: 'rt',
      apiKey: expect.any(String),
      ttl: 60,
    })
  })

  it('returns 500 when JWT generation fails', async () => {
    mockCreateSpeechmaticsJWT.mockRejectedValue(new Error('JWT generation failed'))

    const res = await app.request('/speechmatics/token', {
      method: 'POST',
      headers: authHeaders(),
    }, env)

    expect(res.status).toBe(500)
  })
})
