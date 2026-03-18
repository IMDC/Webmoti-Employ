import {
  API_BASE,
  render,
  screen,
  server,
  userEvent,
} from '@test-utils'
import { http, HttpResponse } from 'msw'
import { AllowlistPage } from './AllowlistPage'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

const allowlistData = {
  allowlist: [
    { id: 1, email: 'user1@example.com', addedById: 'admin-id', createdAt: '2026-01-15T00:00:00Z' },
    { id: 2, email: 'user2@example.com', addedById: 'admin-id', createdAt: '2026-02-20T00:00:00Z' },
  ],
  adminEmails: ['admin@example.com'],
}

beforeEach(() => {
  server.use(
    http.get(`${API_BASE}/admin/allowlist`, () => {
      return HttpResponse.json(allowlistData)
    }),
  )
})

describe('allowlistPage', () => {
  it('shows title and description', async () => {
    render(<AllowlistPage />)

    expect(screen.getByText('Allowlist')).toBeInTheDocument()
    expect(screen.getByText('Emails allowed to create accounts.')).toBeInTheDocument()
  })

  it('displays allowlist entries after loading', async () => {
    render(<AllowlistPage />)

    expect(await screen.findByText('user1@example.com')).toBeInTheDocument()
    expect(screen.getByText('user2@example.com')).toBeInTheDocument()
  })

  it('displays admin emails with badge', async () => {
    render(<AllowlistPage />)

    expect(await screen.findByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('shows error alert when fetch fails', async () => {
    server.use(
      http.get(`${API_BASE}/admin/allowlist`, () => {
        return HttpResponse.json({ error: 'fail' }, { status: 500 })
      }),
    )

    render(<AllowlistPage />)

    expect(await screen.findByText('Failed to load allowlist')).toBeInTheDocument()
  })

  it('adds email via input and button', async () => {
    let addedEmail = ''
    server.use(
      http.post(`${API_BASE}/admin/allowlist`, async ({ request }) => {
        const body = await request.json() as { email: string }
        addedEmail = body.email
        return HttpResponse.json({
          entry: { id: 3, email: body.email, addedById: 'admin-id', createdAt: new Date().toISOString() },
        }, { status: 201 })
      }),
    )

    render(<AllowlistPage />)

    await screen.findByText('user1@example.com')

    const input = screen.getByPlaceholderText('user@example.com')
    const addButton = screen.getByRole('button', { name: 'Add' })

    await userEvent.type(input, 'new@example.com')
    await userEvent.click(addButton)

    await vi.waitFor(() => {
      expect(addedEmail).toBe('new@example.com')
    })
  })

  it('shows empty state when allowlist and admin emails are empty', async () => {
    server.use(
      http.get(`${API_BASE}/admin/allowlist`, () => {
        return HttpResponse.json({ allowlist: [], adminEmails: [] })
      }),
    )

    render(<AllowlistPage />)

    expect(await screen.findByText('No emails in allowlist')).toBeInTheDocument()
  })
})
