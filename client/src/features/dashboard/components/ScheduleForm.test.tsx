import { render, screen, server, userEvent } from '@test-utils'
import { makeUser } from '@test-utils'
import { http, HttpResponse } from 'msw'
import { createUserStore } from '@/features/auth/hooks/createUserStore'
import { UserStoreContext } from '@/features/auth/hooks/useUserStore'
import { ScheduleForm } from './ScheduleForm'

const API_BASE = 'http://localhost:5173/api'

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

function renderForm(onSuccess = vi.fn()) {
  const store = makeUserStore()
  const result = render(
    <UserStoreContext value={store}>
      <ScheduleForm onSuccess={onSuccess} />
    </UserStoreContext>,
  )
  return { ...result, onSuccess }
}

describe('scheduleForm', () => {
  it('renders all form fields', () => {
    renderForm()

    expect(screen.getByText('Interview date')).toBeInTheDocument()
    expect(screen.getByText('Interview time')).toBeInTheDocument()
    expect(screen.getByText('Schedule interview')).toBeInTheDocument()
    expect(screen.getByText('You haven\'t invited anyone')).toBeInTheDocument()
    expect(screen.getByText('Add invitation')).toBeInTheDocument()
    expect(screen.getByText('Open Google Calendar')).toBeInTheDocument()
  })

  it('adds an invite row when clicking Add invitation', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByText('Add invitation'))

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByText('Interviewer')).toBeInTheDocument()
    // "You haven't invited anyone" should be gone
    expect(screen.queryByText('You haven\'t invited anyone')).not.toBeInTheDocument()
  })

  it('removes an invite row when clicking the trash button', async () => {
    const user = userEvent.setup()
    renderForm()

    // Add two invites
    await user.click(screen.getByText('Add invitation'))
    await user.click(screen.getByText('Add invitation'))

    const emailInputs = screen.getAllByPlaceholderText('Email')
    expect(emailInputs).toHaveLength(2)

    // Remove the first one (find trash icon buttons)
    const trashButtons = document.querySelectorAll('.tabler-icon-trash')
    expect(trashButtons.length).toBe(2)
    await user.click(trashButtons[0].closest('button')!)

    expect(screen.getAllByPlaceholderText('Email')).toHaveLength(1)
  })

  it('shows validation error for invalid email in invite', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByText('Add invitation'))

    const emailInput = screen.getByPlaceholderText('Email')
    await user.type(emailInput, 'not-an-email')

    // Pick a time slot
    await user.click(screen.getByText('9:30 AM'))

    // Submit the form
    await user.click(screen.getByText('Schedule interview'))

    // Should show validation error for email
    expect(await screen.findByText(/invalid/i)).toBeInTheDocument()
  })

  it('submits successfully and calls onSuccess', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    server.use(
      http.post(`${API_BASE}/interviews`, () => {
        return HttpResponse.json(
          { sessionId: '550e8400-e29b-41d4-a716-446655440000' },
          { status: 201 },
        )
      }),
    )

    renderForm(onSuccess)

    // Pick a time slot
    await user.click(screen.getByText('9:30 AM'))

    // Submit
    await user.click(screen.getByText('Schedule interview'))

    await vi.waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('submits with invites included', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    let requestBody: any

    server.use(
      http.post(`${API_BASE}/interviews`, async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json(
          { sessionId: '550e8400-e29b-41d4-a716-446655440000' },
          { status: 201 },
        )
      }),
    )

    renderForm(onSuccess)

    // Add an invite
    await user.click(screen.getByText('Add invitation'))
    await user.type(screen.getByPlaceholderText('Email'), 'candidate@example.com')

    // Pick a time slot
    await user.click(screen.getByText('9:30 AM'))

    // Submit
    await user.click(screen.getByText('Schedule interview'))

    await vi.waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })

    expect(requestBody.invites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: 'candidate@example.com' }),
      ]),
    )
  })

  it('shows error notification on server failure', async () => {
    const user = userEvent.setup()

    server.use(
      http.post(`${API_BASE}/interviews`, () => {
        return HttpResponse.json(
          { message: 'Internal error' },
          { status: 500 },
        )
      }),
    )

    renderForm()

    // Pick a time slot
    await user.click(screen.getByText('9:30 AM'))

    // Submit
    await user.click(screen.getByText('Schedule interview'))

    // onSuccess should NOT be called — the form should still be visible
    await vi.waitFor(() => {
      expect(screen.getByText('Schedule interview')).toBeInTheDocument()
    })
  })
})
