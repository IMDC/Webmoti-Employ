import {
  API_BASE,
  render,
  screen,
  server,
} from '@test-utils'
import { http, HttpResponse } from 'msw'
import { OverviewPage } from './OverviewPage'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

const overviewData = {
  stats: {
    totalUsers: 12,
    totalInterviews: 45,
    allowlistSize: 8,
    liveSessionCount: 2,
  },
  recentInterviews: [
    { id: 1, hostId: 'u1', hostName: 'Alice', startTime: '2026-03-17T10:00:00Z', isInstant: false },
  ],
  upcomingInterviews: [
    { id: 2, hostId: 'u2', hostName: 'Bob', startTime: '2026-03-20T14:00:00Z', isInstant: true },
  ],
}

beforeEach(() => {
  server.use(
    http.get(`${API_BASE}/admin/overview`, () => {
      return HttpResponse.json(overviewData)
    }),
  )
})

describe('overviewPage', () => {
  it('shows loading state initially then displays stats', async () => {
    render(<OverviewPage />)

    expect(screen.getByText('Overview')).toBeInTheDocument()

    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('displays stat card labels', async () => {
    render(<OverviewPage />)

    expect(await screen.findByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('Total Interviews')).toBeInTheDocument()
    expect(screen.getByText('Allowlist')).toBeInTheDocument()
    expect(screen.getByText('Live Sessions')).toBeInTheDocument()
  })

  it('displays recent and upcoming interview sections', async () => {
    render(<OverviewPage />)

    expect(await screen.findByText('Recent Interviews')).toBeInTheDocument()
    expect(screen.getByText('Upcoming Interviews')).toBeInTheDocument()
  })

  it('shows host name in recent interviews', async () => {
    render(<OverviewPage />)

    expect(await screen.findByText(/Alice/)).toBeInTheDocument()
  })

  it('shows host name in upcoming interviews', async () => {
    render(<OverviewPage />)

    expect(await screen.findByText(/Bob/)).toBeInTheDocument()
  })

  it('shows error alert when fetch fails', async () => {
    server.use(
      http.get(`${API_BASE}/admin/overview`, () => {
        return HttpResponse.json({ error: 'fail' }, { status: 500 })
      }),
    )

    render(<OverviewPage />)

    expect(await screen.findByText('Failed to load overview')).toBeInTheDocument()
  })

  it('shows empty state when no recent interviews', async () => {
    server.use(
      http.get(`${API_BASE}/admin/overview`, () => {
        return HttpResponse.json({
          ...overviewData,
          recentInterviews: [],
          upcomingInterviews: [],
        })
      }),
    )

    render(<OverviewPage />)

    expect(await screen.findByText('No recent interviews')).toBeInTheDocument()
    expect(screen.getByText('No upcoming interviews')).toBeInTheDocument()
  })
})
