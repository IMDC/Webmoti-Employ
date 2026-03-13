import { server } from '@test-utils'
import { http, HttpResponse } from 'msw'
import { resolveProfiles } from './resolveProfiles'

const API_BASE = 'http://localhost:5173/api'

beforeEach(() => {
  localStorage.setItem('bearer_token', 'test-token')
  localStorage.setItem('bearer_token_expiry', new Date(Date.now() + 86400000).toISOString())
})

afterEach(() => {
  localStorage.clear()
})

describe('resolveProfiles', () => {
  it('fetches profiles by user IDs', async () => {
    server.use(
      http.post(`${API_BASE}/profiles`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>
        expect(body.userIds).toEqual(['user-1', 'user-2'])
        return HttpResponse.json({
          'user-1': { displayName: 'Alice', profilePic: 'https://example.com/alice.jpg' },
          'user-2': { displayName: 'Bob', profilePic: '' },
        })
      }),
    )

    const result = await resolveProfiles({ userIds: ['user-1', 'user-2'] })

    expect(result['user-1']?.displayName).toBe('Alice')
    expect(result['user-2']?.profilePic).toBe('')
  })

  it('fetches profiles by email addresses', async () => {
    server.use(
      http.post(`${API_BASE}/profiles`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>
        expect(body.userEmails).toEqual(['alice@test.com'])
        return HttpResponse.json({
          'alice@test.com': { displayName: 'Alice', profilePic: 'https://example.com/alice.jpg' },
        })
      }),
    )

    const result = await resolveProfiles({ userEmails: ['alice@test.com'] })

    expect(result['alice@test.com']?.displayName).toBe('Alice')
  })

  it('throws HttpError on server failure', async () => {
    server.use(
      http.post(`${API_BASE}/profiles`, () => {
        return HttpResponse.json({ error: 'Forbidden' }, { status: 403 })
      }),
    )

    await expect(resolveProfiles({ userIds: ['x'] })).rejects.toThrow('Failed to resolve profiles')
  })

  it('throws HttpError on invalid response schema', async () => {
    server.use(
      http.post(`${API_BASE}/profiles`, () => {
        return HttpResponse.json({
          'user-1': { displayName: 123, profilePic: 'not-a-url' },
        })
      }),
    )

    await expect(resolveProfiles({ userIds: ['user-1'] })).rejects.toThrow('Invalid profile response')
  })

  it('sends authorization header', async () => {
    let authHeader: string | null = null
    server.use(
      http.post(`${API_BASE}/profiles`, ({ request }) => {
        authHeader = request.headers.get('Authorization')
        return HttpResponse.json({})
      }),
    )

    await resolveProfiles({ userIds: [] })

    expect(authHeader).toBe('Bearer test-token')
  })
})
