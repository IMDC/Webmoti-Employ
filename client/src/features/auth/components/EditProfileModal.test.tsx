import { render, screen, userEvent } from '@test-utils'
import { makeUser } from '@test-utils'
import { createUserStore } from '@/features/auth/hooks/createUserStore'
import { UserStoreContext } from '@/features/auth/hooks/useUserStore'
import { EditProfileModal } from './EditProfileModal'

// Mock auth-client to prevent real API calls
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    updateUser: vi.fn().mockResolvedValue({}),
    deleteUser: vi.fn().mockResolvedValue({}),
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

function renderModal(isOpen = true, onClose = vi.fn()) {
  const store = makeUserStore()
  return {
    ...render(
      <UserStoreContext value={store}>
        <EditProfileModal isOpen={isOpen} onClose={onClose} />
      </UserStoreContext>,
    ),
    onClose,
  }
}

describe('editProfileModal', () => {
  it('renders profile editing fields when open', () => {
    renderModal()

    expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Profile picture URL')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    renderModal(false)

    expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument()
  })

  it('populates fields with current user data', () => {
    renderModal()

    expect(screen.getByLabelText('Name')).toHaveValue('Test User')
    expect(screen.getByLabelText('Profile picture URL')).toHaveValue('https://example.com/avatar.jpg')
  })

  it('save button is disabled when no changes made', () => {
    renderModal()

    expect(screen.getByText('Save').closest('button')).toBeDisabled()
  })

  it('save button enables when name is changed', async () => {
    const user = userEvent.setup()
    renderModal()

    const nameInput = screen.getByLabelText('Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')

    expect(screen.getByText('Save').closest('button')).not.toBeDisabled()
  })

  it('shows delete account confirmation on click', async () => {
    const user = userEvent.setup()
    renderModal()

    // Initially shows "Delete Account" button
    await user.click(screen.getByText('Delete Account'))

    // Now shows confirmation
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    // The red "Delete Account" confirm button
    expect(screen.getAllByText('Delete Account')).toHaveLength(1)
  })

  it('cancel hides confirmation and goes back to delete button', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByText('Delete Account'))
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument()

    await user.click(screen.getByText('Cancel'))

    expect(screen.queryByText(/this action cannot be undone/i)).not.toBeInTheDocument()
    expect(screen.getByText('Delete Account')).toBeInTheDocument()
  })
})
