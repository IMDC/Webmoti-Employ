import {
  API_BASE,
  render,
  screen,
  server,
} from '@test-utils'
import { http, HttpResponse } from 'msw'
import { UsersPage } from './UsersPage'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
}))

const usersData = {
  users: [
    { id: 'u1', email: 'alice@example.com', name: 'Alice Smith', image: null, createdAt: '2026-01-10T00:00:00Z' },
    { id: 'u2', email: 'bob@example.com', name: 'Bob Jones', image: 'https://example.com/bob.jpg', createdAt: '2026-02-15T00:00:00Z' },
  ],
  adminEmails: ['alice@example.com'],
}

beforeEach(() => {
  server.use(
    http.get(`${API_BASE}/admin/users`, () => {
      return HttpResponse.json(usersData)
    }),
  )
})

describe('usersPage', () => {
  it('shows title and description', async () => {
    render(<UsersPage />)

    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('All registered accounts.')).toBeInTheDocument()
  })

  it('displays users after loading', async () => {
    render(<UsersPage />)

    expect(await screen.findByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
  })

  it('displays user emails', async () => {
    render(<UsersPage />)

    expect(await screen.findByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('shows error alert when fetch fails', async () => {
    server.use(
      http.get(`${API_BASE}/admin/users`, () => {
        return HttpResponse.json({ error: 'fail' }, { status: 500 })
      }),
    )

    render(<UsersPage />)

    expect(await screen.findByText('Failed to load users')).toBeInTheDocument()
  })

  it('shows empty state when no users exist', async () => {
    server.use(
      http.get(`${API_BASE}/admin/users`, () => {
        return HttpResponse.json({ users: [], adminEmails: [] })
      }),
    )

    render(<UsersPage />)

    expect(await screen.findByText('No users found')).toBeInTheDocument()
  })

  it('shows delete button for non-admin users', async () => {
    render(<UsersPage />)

    await screen.findByText('Alice Smith')

    // Alice is in adminEmails so she has no delete button; only Bob does
    const deleteButtons = screen.getAllByLabelText('Delete user')
    expect(deleteButtons).toHaveLength(1)
  })
})
