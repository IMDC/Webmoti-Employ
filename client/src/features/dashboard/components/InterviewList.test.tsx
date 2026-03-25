import {
  API_BASE,
  makeInterview,
  makeUser,
  render,
  resetFactories,
  screen,
  server,
  userEvent,
} from '@test-utils'
import { DateTime } from 'luxon'
import { delay, http, HttpResponse } from 'msw'
import { createUserStore } from '@/features/auth/hooks/createUserStore'
import { UserStoreContext } from '@/features/auth/hooks/useUserStore'
import { InterviewList } from './InterviewList'

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
  server.use(
    http.post(`${API_BASE}/profiles`, () => HttpResponse.json({})),
  )
})

function todayAt(hour: number, minute = 0) {
  return DateTime.local().set({ hour, minute, second: 0, millisecond: 0 }).toJSDate()
}

function daysFromNow(days: number, hour = 10) {
  return DateTime.local().plus({ days }).set({ hour, minute: 0, second: 0, millisecond: 0 }).toJSDate()
}

describe('interviewList', () => {
  it('shows loading skeletons while fetching', () => {
    // Default handler returns empty but we want the request to stay pending
    server.use(
      http.get(`${API_BASE}/interviews`, async () => {
        await delay('infinite')
      }),
    )

    renderWithUser(<InterviewList />)

    // InterviewCardSkeleton renders Mantine Skeleton components
    const skeletons = document.querySelectorAll('[class*="Skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)

    // Should not show error or empty state while loading
    expect(screen.queryByText('Error fetching interviews')).not.toBeInTheDocument()
    expect(screen.queryByText('No scheduled interviews')).not.toBeInTheDocument()
  })

  it('shows error state when fetch fails', async () => {
    server.use(
      http.get(`${API_BASE}/interviews`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )

    renderWithUser(<InterviewList />)

    expect(await screen.findByText('Error fetching interviews')).toBeInTheDocument()
  })

  it('shows empty state when no interviews exist', async () => {
    server.use(
      http.get(`${API_BASE}/interviews`, () => {
        return HttpResponse.json({ interviews: [] })
      }),
    )

    renderWithUser(<InterviewList />)

    expect(await screen.findByText('No scheduled interviews')).toBeInTheDocument()
  })

  it('defaults to "today" tab and shows today interviews', async () => {
    const todayInterview = makeInterview({
      startTime: todayAt(14),
      endTime: todayAt(15),
      invites: [
        { id: 1, interviewId: 1, email: 'test@torontomu.ca', isInterviewer: true },
        { id: 2, interviewId: 1, email: 'other@example.com', isInterviewer: false },
      ],
    })

    const upcomingInterview = makeInterview({
      startTime: daysFromNow(3),
      endTime: daysFromNow(3, 11),
      invites: [
        { id: 3, interviewId: 2, email: 'test@torontomu.ca', isInterviewer: true },
        { id: 4, interviewId: 2, email: 'future@example.com', isInterviewer: false },
      ],
    })

    server.use(
      http.get(`${API_BASE}/interviews`, () => {
        return HttpResponse.json({ interviews: [todayInterview, upcomingInterview] })
      }),
    )

    renderWithUser(<InterviewList />)

    // Wait for data to load (should show exactly 1 interview card (today's))
    const joinButtons = await screen.findAllByText('Join')
    expect(joinButtons).toHaveLength(1)

    // "Today" tab should be active
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('filters upcoming interviews when switching tab', async () => {
    const user = userEvent.setup()

    const todayInterview = makeInterview({
      startTime: todayAt(14),
      endTime: todayAt(15),
      invites: [
        { id: 1, interviewId: 1, email: 'test@torontomu.ca', isInterviewer: true },
        { id: 2, interviewId: 1, email: 'other@example.com', isInterviewer: false },
      ],
    })

    const upcomingInterview = makeInterview({
      startTime: daysFromNow(3),
      endTime: daysFromNow(3, 11),
      invites: [
        { id: 3, interviewId: 2, email: 'test@torontomu.ca', isInterviewer: true },
        { id: 4, interviewId: 2, email: 'future@example.com', isInterviewer: false },
      ],
    })

    server.use(
      http.get(`${API_BASE}/interviews`, () => {
        return HttpResponse.json({ interviews: [todayInterview, upcomingInterview] })
      }),
    )

    renderWithUser(<InterviewList />)

    // Wait for today's interview to load
    await screen.findAllByText('Join')

    // Switch to upcoming tab
    await user.click(screen.getByText('Upcoming'))

    // Should show the upcoming interview
    const joinButtons = screen.getAllByText('Join')
    expect(joinButtons).toHaveLength(1)
  })

  it('filters past interviews when switching tab', async () => {
    const user = userEvent.setup()

    const pastInterview = makeInterview({
      startTime: daysFromNow(-3, 10),
      endTime: daysFromNow(-3, 11),
      invites: [
        { id: 1, interviewId: 1, email: 'test@torontomu.ca', isInterviewer: true },
        { id: 2, interviewId: 1, email: 'past@example.com', isInterviewer: false },
      ],
    })

    const todayInterview = makeInterview({
      startTime: todayAt(14),
      endTime: todayAt(15),
      invites: [
        { id: 3, interviewId: 2, email: 'test@torontomu.ca', isInterviewer: true },
        { id: 4, interviewId: 2, email: 'other@example.com', isInterviewer: false },
      ],
    })

    server.use(
      http.get(`${API_BASE}/interviews`, () => {
        return HttpResponse.json({ interviews: [pastInterview, todayInterview] })
      }),
    )

    renderWithUser(<InterviewList />)

    // Wait for data to load
    await screen.findAllByText('Join')

    // Switch to past tab
    await user.click(screen.getByText('Past'))

    // Should show the past interview
    const joinButtons = screen.getAllByText('Join')
    expect(joinButtons).toHaveLength(1)
  })

  it('shows "No interviews to show" when filtered list is empty', async () => {
    const user = userEvent.setup()

    // Only a today interview, upcoming/past tabs should be empty
    const todayInterview = makeInterview({
      startTime: todayAt(14),
      endTime: todayAt(15),
      invites: [
        { id: 1, interviewId: 1, email: 'test@torontomu.ca', isInterviewer: true },
        { id: 2, interviewId: 1, email: 'other@example.com', isInterviewer: false },
      ],
    })

    server.use(
      http.get(`${API_BASE}/interviews`, () => {
        return HttpResponse.json({ interviews: [todayInterview] })
      }),
    )

    renderWithUser(<InterviewList />)

    // Wait for data
    await screen.findAllByText('Join')

    // Switch to upcoming (should have 0 filtered results)
    await user.click(screen.getByText('Upcoming'))

    expect(screen.getByText('No interviews to show')).toBeInTheDocument()
  })
})
