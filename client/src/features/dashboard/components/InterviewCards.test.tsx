import type { InterviewResponse } from '@webmoti-employ/shared'
import { render, screen, server } from '@test-utils'
import { makeInterview, makeUser, resetFactories } from '@test-utils/../test-utils/factories'
import { DateTime } from 'luxon'
import { http, HttpResponse } from 'msw'
import { createUserStore } from '@/features/auth/hooks/createUserStore'
import { UserStoreContext } from '@/features/auth/hooks/useUserStore'
import { InterviewCards } from './InterviewCards'

const API_BASE = 'http://localhost:5173/api'

// Mock TanStack Router's Link to render a plain anchor
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, ...props }: any) => {
    const href = params?.id ? `${to}`.replace('$id', params.id) : to
    return <a href={href} {...props}>{children}</a>
  },
}))

function makeUserStore() {
  return createUserStore({
    session: {
      id: 'test-session-id',
      userId: 'test-user-id',
      token: 'test-bearer-token',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    },
    user: makeUser(),
  })
}

function renderWithUser(ui: React.ReactNode) {
  const store = makeUserStore()
  return render(
    <UserStoreContext value={store}>
      {ui}
    </UserStoreContext>,
  )
}

beforeEach(() => {
  resetFactories()
  // Mock profile resolution to return empty (so InterviewCard renders without profile data)
  server.use(
    http.post(`${API_BASE}/profiles`, () => {
      return HttpResponse.json({})
    }),
  )
})

describe('interviewCards', () => {
  it('renders interview cards', () => {
    const interviews: InterviewResponse[] = [
      makeInterview({
        invites: [
          { id: 1, interviewId: 1, email: 'test@torontomu.ca', isInterviewer: true },
          { id: 2, interviewId: 1, email: 'candidate@example.com', isInterviewer: false },
        ],
      }),
    ]

    renderWithUser(<InterviewCards interviews={interviews} />)

    expect(screen.getByText('Interviewer')).toBeInTheDocument()
    expect(screen.getByText('Join')).toBeInTheDocument()
  })

  it('shows empty state when no interviews', () => {
    renderWithUser(<InterviewCards interviews={[]} />)

    expect(screen.getByText('No interviews to show')).toBeInTheDocument()
  })

  it('paginates when more than pageSize interviews', () => {
    const interviews = Array.from({ length: 8 }, (_, i) =>
      makeInterview({
        invites: [
          { id: 1, interviewId: i + 1, email: 'test@torontomu.ca', isInterviewer: true },
          { id: 2, interviewId: i + 1, email: 'candidate@example.com', isInterviewer: false },
        ],
      }))

    renderWithUser(<InterviewCards interviews={interviews} pageSize={5} />)

    // Should show 5 interview cards on first page
    const joinButtons = screen.getAllByText('Join')
    expect(joinButtons).toHaveLength(5)
  })

  it('shows delete button for creator only', () => {
    const interviews: InterviewResponse[] = [
      makeInterview({
        creatorId: 'test-user-id', // matches our test user
        invites: [
          { id: 1, interviewId: 1, email: 'test@torontomu.ca', isInterviewer: true },
          { id: 2, interviewId: 1, email: 'other@example.com', isInterviewer: false },
        ],
      }),
      makeInterview({
        creatorId: 'other-user-id', // does NOT match
        invites: [
          { id: 3, interviewId: 2, email: 'test@torontomu.ca', isInterviewer: false },
          { id: 4, interviewId: 2, email: 'other@example.com', isInterviewer: true },
        ],
      }),
    ]

    renderWithUser(<InterviewCards interviews={interviews} />)

    // Only creator's card should have the delete button
    const deleteButtons = screen.getAllByLabelText('Delete interview')
    expect(deleteButtons).toHaveLength(1)
  })

  it('shows Interviewee badge when user is not interviewer', () => {
    const interviews: InterviewResponse[] = [
      makeInterview({
        invites: [
          { id: 1, interviewId: 1, email: 'test@torontomu.ca', isInterviewer: false },
          { id: 2, interviewId: 1, email: 'interviewer@example.com', isInterviewer: true },
        ],
      }),
    ]

    renderWithUser(<InterviewCards interviews={interviews} />)

    expect(screen.getByText('Interviewee')).toBeInTheDocument()
  })

  it('displays formatted date', () => {
    const startTime = DateTime.fromObject(
      { year: 2026, month: 6, day: 15, hour: 14, minute: 0 },
      { zone: 'local' },
    ).toJSDate()

    const interviews: InterviewResponse[] = [
      makeInterview({
        startTime,
        invites: [
          { id: 1, interviewId: 1, email: 'test@torontomu.ca', isInterviewer: true },
          { id: 2, interviewId: 1, email: 'other@example.com', isInterviewer: false },
        ],
      }),
    ]

    renderWithUser(<InterviewCards interviews={interviews} />)

    // DateTime.DATETIME_MED renders like "Jun 15, 2026, 2:00 PM"
    expect(screen.getByText(/Jun 15, 2026/)).toBeInTheDocument()
  })

  it('disables join button for ended interviews', () => {
    const pastEnd = DateTime.local().minus({ days: 1 }).toJSDate()
    const pastStart = DateTime.local().minus({ days: 1, hours: 1 }).toJSDate()

    const interviews: InterviewResponse[] = [
      makeInterview({
        startTime: pastStart,
        endTime: pastEnd,
        invites: [
          { id: 1, interviewId: 1, email: 'test@torontomu.ca', isInterviewer: true },
          { id: 2, interviewId: 1, email: 'other@example.com', isInterviewer: false },
        ],
      }),
    ]

    renderWithUser(<InterviewCards interviews={interviews} />)

    const joinButton = screen.getByText('Join').closest('button')
    expect(joinButton).toBeDisabled()
  })

  it('shows no participants text when only one invite', () => {
    const interviews: InterviewResponse[] = [
      makeInterview({
        invites: [
          { id: 1, interviewId: 1, email: 'test@torontomu.ca', isInterviewer: true },
        ],
      }),
    ]

    renderWithUser(<InterviewCards interviews={interviews} />)

    expect(screen.getByText('No participants invited')).toBeInTheDocument()
  })
})
