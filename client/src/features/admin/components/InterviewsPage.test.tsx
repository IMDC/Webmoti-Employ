import {
  API_BASE,
  render,
  screen,
  server,
  userEvent,
} from '@test-utils'
import { http, HttpResponse } from 'msw'
import { InterviewsPage } from './InterviewsPage'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
}))

const interviewsData = {
  interviews: [
    {
      id: 1,
      hostId: 'u1',
      hostName: 'Alice Smith',
      hostEmail: 'alice@example.com',
      startTime: '2026-03-15T10:00:00Z',
      endTime: '2026-03-15T11:00:00Z',
      isInstant: false,
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: '2026-03-10T00:00:00Z',
      updatedAt: '2026-03-10T00:00:00Z',
      invites: [
        { id: 1, interviewId: 1, email: 'alice@example.com', isInterviewer: true, name: 'Alice Smith', userId: 'u1' },
        { id: 2, interviewId: 1, email: 'candidate@example.com', isInterviewer: false, name: null, userId: null },
      ],
    },
    {
      id: 2,
      hostId: 'u2',
      hostName: 'Bob Jones',
      hostEmail: 'bob@example.com',
      startTime: '2026-03-16T14:00:00Z',
      endTime: null,
      isInstant: true,
      sessionId: '660e8400-e29b-41d4-a716-446655440000',
      createdAt: '2026-03-16T00:00:00Z',
      updatedAt: '2026-03-16T00:00:00Z',
      invites: [],
    },
  ],
}

beforeEach(() => {
  server.use(
    http.get(`${API_BASE}/admin/interviews`, () => {
      return HttpResponse.json(interviewsData)
    }),
  )
})

describe('interviewsPage', () => {
  it('shows title and description', async () => {
    render(<InterviewsPage />)

    expect(screen.getByText('Interviews')).toBeInTheDocument()
    expect(screen.getByText('All scheduled and instant interviews.')).toBeInTheDocument()
  })

  it('displays interviews after loading', async () => {
    render(<InterviewsPage />)

    // Alice Smith appears in both Host and Participants columns
    expect((await screen.findAllByText('Alice Smith')).length).toBeGreaterThan(0)

    // Bob's interview is instant, toggle the checkbox to show it
    await userEvent.click(screen.getByLabelText('Show instant interviews'))
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
  })

  it('shows Scheduled and Instant badges', async () => {
    render(<InterviewsPage />)

    await screen.findAllByText('Alice Smith')
    expect(screen.getByText('Scheduled')).toBeInTheDocument()

    // Bob's interview is instant, toggle the checkbox to show it
    await userEvent.click(screen.getByLabelText('Show instant interviews'))
    expect(screen.getByText('Instant')).toBeInTheDocument()
  })

  it('shows participant names for invites with known users', async () => {
    render(<InterviewsPage />)

    await screen.findAllByText('Alice Smith')

    // candidate@example.com has no name, should show email prefix
    expect(screen.getByText('candidate')).toBeInTheDocument()
  })

  it('shows error alert when fetch fails', async () => {
    server.use(
      http.get(`${API_BASE}/admin/interviews`, () => {
        return HttpResponse.json({ error: 'fail' }, { status: 500 })
      }),
    )

    render(<InterviewsPage />)

    expect(await screen.findByText('Failed to load interviews')).toBeInTheDocument()
  })

  it('shows empty state when no interviews exist', async () => {
    server.use(
      http.get(`${API_BASE}/admin/interviews`, () => {
        return HttpResponse.json({ interviews: [] })
      }),
    )

    render(<InterviewsPage />)

    expect(await screen.findByText('No interviews found')).toBeInTheDocument()
  })

  it('shows delete button for each interview', async () => {
    render(<InterviewsPage />)

    await screen.findAllByText('Alice Smith')

    // toggle to show instant interviews too
    await userEvent.click(screen.getByLabelText('Show instant interviews'))

    const deleteButtons = screen.getAllByLabelText('Delete')
    expect(deleteButtons).toHaveLength(2)
  })
})
