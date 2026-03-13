import { env } from 'cloudflare:test'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import app from '../../src'
import { jsonAuthHeaders, TEST_SESSION, TEST_USER } from '../helpers/auth'

const {
  mockGetSession,
  mockGetProfilesByIds,
  mockGetProfilesByEmails,
  mockDb,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetProfilesByIds: vi.fn(),
  mockGetProfilesByEmails: vi.fn(),
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

vi.mock('@/routes/profiles/db-queries', () => ({
  getProfilesByIds: mockGetProfilesByIds,
  getProfilesByEmails: mockGetProfilesByEmails,
}))

describe('pOST /profiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({
      user: TEST_USER,
      session: TEST_SESSION,
    })
    mockGetProfilesByIds.mockResolvedValue([])
    mockGetProfilesByEmails.mockResolvedValue([])
  })

  it('returns profiles by user IDs', async () => {
    mockGetProfilesByIds.mockResolvedValue([
      { id: 'user-1', name: 'Alice', image: 'https://example.com/alice.jpg', email: 'alice@example.com' },
    ])

    const res = await app.request('/profiles', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ userIds: ['user-1'] }),
    }, env)

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body['user-1']).toEqual({
      displayName: 'Alice',
      profilePic: 'https://example.com/alice.jpg',
    })
  })

  it('returns profiles by emails', async () => {
    mockGetProfilesByEmails.mockResolvedValue([
      { id: 'user-2', name: 'Bob', image: null, email: 'bob@example.com' },
    ])

    const res = await app.request('/profiles', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ userEmails: ['bob@example.com'] }),
    }, env)

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body['bob@example.com']).toEqual({
      displayName: 'Bob',
      profilePic: '',
    })
  })

  it('handles users with no profile picture (null image)', async () => {
    mockGetProfilesByIds.mockResolvedValue([
      { id: 'user-3', name: 'Charlie', image: null, email: 'charlie@example.com' },
    ])

    const res = await app.request('/profiles', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ userIds: ['user-3'] }),
    }, env)

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body['user-3'].profilePic).toBe('')
  })

  it('returns results from both IDs and emails', async () => {
    mockGetProfilesByIds.mockResolvedValue([
      { id: 'user-1', name: 'Alice', image: 'https://example.com/alice.jpg', email: 'alice@example.com' },
    ])
    mockGetProfilesByEmails.mockResolvedValue([
      { id: 'user-2', name: 'Bob', image: null, email: 'bob@example.com' },
    ])

    const res = await app.request('/profiles', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        userIds: ['user-1'],
        userEmails: ['bob@example.com'],
      }),
    }, env)

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body['user-1']).toBeDefined()
    expect(body['bob@example.com']).toBeDefined()
  })

  it('returns 400 when neither userIds nor userEmails provided', async () => {
    const res = await app.request('/profiles', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({}),
    }, env)

    expect(res.status).toBe(400)
  })

  it('returns 400 when both are empty arrays', async () => {
    const res = await app.request('/profiles', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ userIds: [], userEmails: [] }),
    }, env)

    expect(res.status).toBe(400)
  })

  it('returns empty object when no users match', async () => {
    mockGetProfilesByIds.mockResolvedValue([])

    const res = await app.request('/profiles', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ userIds: ['nonexistent'] }),
    }, env)

    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body).toEqual({})
  })
})
