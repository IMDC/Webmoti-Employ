import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_BASE, server } from '@test-utils'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useInterviewSession } from './queries'

// Valid JWT for schema validation (z.jwt())
const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'

// Mock TanStack Router hooks
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
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

describe('useInterviewSession', () => {
  it('fetches session for joining (with sessionId)', async () => {
    server.use(
      http.get(`${API_BASE}/sessions/:sessionId`, () => {
        return HttpResponse.json({
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          token: MOCK_JWT,
        })
      }),
    )

    const { result } = renderHook(
      () => useInterviewSession('550e8400-e29b-41d4-a716-446655440000'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.isInterviewSessionPending).toBe(false)
    })

    expect(result.current.interviewSessionError).toBeNull()
    expect(result.current.interviewSession).toBeDefined()
    expect(result.current.interviewSession!.token).toBe(MOCK_JWT)
  })

  it('fetches session for creating (without sessionId)', async () => {
    server.use(
      http.get(`${API_BASE}/sessions`, () => {
        return HttpResponse.json({
          sessionId: '660e8400-e29b-41d4-a716-446655440000',
          token: MOCK_JWT,
        })
      }),
    )

    const { result } = renderHook(
      () => useInterviewSession(undefined),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.interviewSession).toBeDefined()
    })

    expect(result.current.interviewSession!.token).toBe(MOCK_JWT)
  })

  it('returns error on server failure', async () => {
    server.use(
      http.get(`${API_BASE}/sessions/:sessionId`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )

    const { result } = renderHook(
      () => useInterviewSession('nonexistent-id'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.interviewSessionError).toBeTruthy()
    })

    expect(result.current.interviewSessionError!.message).toContain('Failed to join session')
  })
})
