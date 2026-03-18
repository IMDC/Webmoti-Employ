import type { InterviewResponse } from '@webmoti-employ/shared'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  API_BASE,
  createTestQueryClient,
  makeInterview,
  renderHook,
  resetFactories,
  server,
  waitFor,
} from '@test-utils'
import { http, HttpResponse } from 'msw'
import { useDeleteInterview, useInterviews, useScheduleInterview } from './queries'

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => resetFactories())

describe('useInterviews', () => {
  it('fetches and returns interviews', async () => {
    const mockInterviews: InterviewResponse[] = [makeInterview(), makeInterview()]
    server.use(
      http.get(`${API_BASE}/interviews`, () => {
        return HttpResponse.json({ interviews: mockInterviews })
      }),
    )

    const { result } = renderHook(() => useInterviews(), { wrapper })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.interviews).toHaveLength(2)
    expect(result.current.error).toBeNull()
  })

  it('returns empty array when no interviews', async () => {
    server.use(
      http.get(`${API_BASE}/interviews`, () => {
        return HttpResponse.json({ interviews: [] })
      }),
    )

    const { result } = renderHook(() => useInterviews(), { wrapper })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.interviews).toEqual([])
  })

  it('returns error on network failure', async () => {
    server.use(
      http.get(`${API_BASE}/interviews`, () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 })
      }),
    )

    const { result } = renderHook(() => useInterviews(), { wrapper })

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })
  })

  it('returns error on malformed response', async () => {
    server.use(
      http.get(`${API_BASE}/interviews`, () => {
        return HttpResponse.json({ bad: 'data' })
      }),
    )

    const { result } = renderHook(() => useInterviews(), { wrapper })

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })
  })
})

describe('useScheduleInterview', () => {
  it('schedules an interview and returns sessionId', async () => {
    const mockSessionId = '550e8400-e29b-41d4-a716-446655440000'
    server.use(
      http.post(`${API_BASE}/interviews`, () => {
        return HttpResponse.json({ sessionId: mockSessionId }, { status: 201 })
      }),
    )

    const { result } = renderHook(() => useScheduleInterview(), { wrapper })

    const sessionId = await result.current.scheduleInterviewMutation({
      hostId: 'test-user-id',
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      isInstant: false,
      invites: [{ email: 'invited@example.com', isInterviewer: false }],
    })

    expect(sessionId).toBe(mockSessionId)
  })

  it('throws HttpError on server error', async () => {
    server.use(
      http.post(`${API_BASE}/interviews`, () => {
        return HttpResponse.json(
          { error: 'Cannot invite yourself' },
          { status: 400 },
        )
      }),
    )

    const { result } = renderHook(() => useScheduleInterview(), { wrapper })

    await expect(
      result.current.scheduleInterviewMutation({
        hostId: 'test-user-id',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        isInstant: false,
      }),
    ).rejects.toThrow()
  })

  it('throws on malformed success response', async () => {
    server.use(
      http.post(`${API_BASE}/interviews`, () => {
        return HttpResponse.json({ bad: 'data' }, { status: 201 })
      }),
    )

    const { result } = renderHook(() => useScheduleInterview(), { wrapper })

    await expect(
      result.current.scheduleInterviewMutation({
        hostId: 'test-user-id',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        isInstant: false,
      }),
    ).rejects.toThrow()
  })
})

describe('useDeleteInterview', () => {
  it('deletes an interview successfully', async () => {
    server.use(
      http.delete(`${API_BASE}/interviews/:id`, () => {
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { result } = renderHook(() => useDeleteInterview(), { wrapper })

    await expect(result.current.deleteInterviewMutation(1)).resolves.toBeUndefined()
  })

  it('throws on 404', async () => {
    server.use(
      http.delete(`${API_BASE}/interviews/:id`, () => {
        return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      }),
    )

    const { result } = renderHook(() => useDeleteInterview(), { wrapper })

    await expect(result.current.deleteInterviewMutation(999)).rejects.toThrow()
  })

  it('throws on 403', async () => {
    server.use(
      http.delete(`${API_BASE}/interviews/:id`, () => {
        return HttpResponse.json({ error: 'Forbidden' }, { status: 403 })
      }),
    )

    const { result } = renderHook(() => useDeleteInterview(), { wrapper })

    await expect(result.current.deleteInterviewMutation(1)).rejects.toThrow()
  })
})
