import type { Participant } from '@zoom/videosdk'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_BASE, server } from '@test-utils'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useInviteProfiles } from './useInviteProfiles'
import { useParticipantProfiles } from './useParticipantProfiles'
import { useProfiles } from './useProfiles'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  localStorage.setItem('bearer_token', 'test-token')
  localStorage.setItem('bearer_token_expiry', new Date(Date.now() + 86400000).toISOString())
})

afterEach(() => {
  localStorage.clear()
})

describe('useProfiles', () => {
  it('fetches profiles by IDs', async () => {
    server.use(
      http.post(`${API_BASE}/profiles`, () => {
        return HttpResponse.json({
          u1: { displayName: 'Alice', profilePic: 'https://example.com/a.jpg' },
        })
      }),
    )

    const { result } = renderHook(
      () => useProfiles({ kind: 'ids', values: ['u1'] }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.profiles).toBeDefined()
    })

    expect(result.current.profiles!.u1?.displayName).toBe('Alice')
  })

  it('does not fetch when values array is empty', () => {
    const { result } = renderHook(
      () => useProfiles({ kind: 'ids', values: [] }),
      { wrapper: createWrapper() },
    )

    // isPending is true because query is disabled (never fires)
    expect(result.current.profiles).toBeUndefined()
  })

  it('does not fetch when isEnabled is false', () => {
    const { result } = renderHook(
      () => useProfiles({ kind: 'emails', values: ['a@b.com'] }, false),
      { wrapper: createWrapper() },
    )

    expect(result.current.profiles).toBeUndefined()
  })
})

describe('useInviteProfiles', () => {
  it('fetches profiles by email addresses', async () => {
    server.use(
      http.post(`${API_BASE}/profiles`, () => {
        return HttpResponse.json({
          'bob@test.com': { displayName: 'Bob', profilePic: '' },
        })
      }),
    )

    const { result } = renderHook(
      () => useInviteProfiles(['bob@test.com']),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.profiles).toBeDefined()
    })

    expect(result.current.profiles!['bob@test.com']?.displayName).toBe('Bob')
  })
})

describe('useParticipantProfiles', () => {
  it('extracts user IDs from participant displayNames', async () => {
    let requestBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${API_BASE}/profiles`, async ({ request }) => {
        requestBody = await request.json() as Record<string, unknown>
        return HttpResponse.json({
          'db-user-1': { displayName: 'Alice', profilePic: 'https://example.com/a.jpg' },
          'db-user-2': { displayName: 'Bob', profilePic: '' },
        })
      }),
    )

    const participants = new Map<number, Participant>([
      [1, { displayName: 'db-user-1', userId: 1 } as Participant],
      [2, { displayName: 'db-user-2', userId: 2 } as Participant],
    ])

    const { result } = renderHook(
      () => useParticipantProfiles(participants),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.profiles).toBeDefined()
    })

    // Sorted user IDs sent to the server
    expect(requestBody).toEqual({ userIds: ['db-user-1', 'db-user-2'] })
    expect(result.current.profiles!['db-user-1']?.displayName).toBe('Alice')
  })

  it('returns no profiles when participants map is empty', () => {
    const { result } = renderHook(
      () => useParticipantProfiles(new Map()),
      { wrapper: createWrapper() },
    )

    expect(result.current.profiles).toBeUndefined()
  })
})
