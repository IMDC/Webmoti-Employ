import {
  API_BASE,
  render,
  screen,
  server,
} from '@test-utils'
import { http, HttpResponse } from 'msw'
import { LiveSessionsPage } from './LiveSessionsPage'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

const liveSessionsData = {
  sessions: [
    {
      id: 'sess-1',
      session_name: '550e8400-e29b-41d4-a716-446655440000',
      session_key: '660e8400-e29b-41d4-a716-446655440000',
      start_time: '2026-03-18T10:00:00Z',
      end_time: '',
      user_count: 3,
      interviewId: 5,
    },
    {
      id: 'sess-2',
      session_name: '770e8400-e29b-41d4-a716-446655440000',
      session_key: '880e8400-e29b-41d4-a716-446655440000',
      start_time: '2026-03-18T11:00:00Z',
      end_time: '',
      user_count: 1,
      interviewId: null,
    },
  ],
}

beforeEach(() => {
  server.use(
    http.get(`${API_BASE}/admin/live-sessions`, () => {
      return HttpResponse.json(liveSessionsData)
    }),
  )
})

describe('liveSessionsPage', () => {
  it('shows title and auto-refreshing badge', async () => {
    render(<LiveSessionsPage />)

    expect(screen.getByText('Live Sessions')).toBeInTheDocument()
    expect(screen.getByText('Auto-refreshing')).toBeInTheDocument()
  })

  it('shows description', async () => {
    render(<LiveSessionsPage />)

    expect(screen.getByText('Currently active interview sessions.')).toBeInTheDocument()
  })

  it('displays session participant counts', async () => {
    render(<LiveSessionsPage />)

    expect(await screen.findByText('3 users')).toBeInTheDocument()
    expect(screen.getByText('1 user')).toBeInTheDocument()
  })

  it('shows linked interview id for sessions with interviews', async () => {
    render(<LiveSessionsPage />)

    expect(await screen.findByText('#5')).toBeInTheDocument()
  })

  it('shows N/A for sessions without linked interviews', async () => {
    render(<LiveSessionsPage />)

    expect(await screen.findByText('N/A')).toBeInTheDocument()
  })

  it('shows error alert when fetch fails', async () => {
    server.use(
      http.get(`${API_BASE}/admin/live-sessions`, () => {
        return HttpResponse.json({ error: 'fail' }, { status: 500 })
      }),
    )

    render(<LiveSessionsPage />)

    expect(await screen.findByText('Failed to load live sessions')).toBeInTheDocument()
  })

  it('shows empty state when no active sessions', async () => {
    server.use(
      http.get(`${API_BASE}/admin/live-sessions`, () => {
        return HttpResponse.json({ sessions: [] })
      }),
    )

    render(<LiveSessionsPage />)

    expect(await screen.findByText('No active sessions')).toBeInTheDocument()
  })
})
