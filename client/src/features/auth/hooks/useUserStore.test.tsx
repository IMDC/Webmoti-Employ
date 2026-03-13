import type { ReactNode } from 'react'
import { makeSession } from '@test-utils/../test-utils/factories'
import { act, renderHook } from '@testing-library/react'
import { createUserStore } from './createUserStore'
import { UserStoreContext, useSession, useUpdateUser, useUser } from './useUserStore'

function makeWrapper() {
  const session = makeSession()
  const store = createUserStore(session)
  return ({ children }: { children: ReactNode }) => (
    <UserStoreContext value={store}>
      {children}
    </UserStoreContext>
  )
}

describe('useUserStore hooks', () => {
  it('useUser returns the user from store', () => {
    const { result } = renderHook(() => useUser(), { wrapper: makeWrapper() })

    expect(result.current.id).toBe('test-user-id')
    expect(result.current.email).toBe('test@torontomu.ca')
    expect(result.current.name).toBe('Test User')
  })

  it('useSession returns the session from store', () => {
    const { result } = renderHook(() => useSession(), { wrapper: makeWrapper() })

    expect(result.current.id).toBe('test-session-id')
    expect(result.current.token).toBe('test-bearer-token')
  })

  it('useUpdateUser updates the user in store', () => {
    const wrapper = makeWrapper()
    const { result: userResult } = renderHook(() => useUser(), { wrapper })
    const { result: updateResult } = renderHook(() => useUpdateUser(), { wrapper })

    expect(userResult.current.name).toBe('Test User')

    act(() => {
      updateResult.current({ name: 'Updated Name' })
    })

    expect(userResult.current.name).toBe('Updated Name')
  })

  it('useUser throws when used outside provider', () => {
    // Suppress console.error for the expected error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useUser())
    }).toThrow('useUserStoreApi must be used within a UserContextProvider')

    consoleSpy.mockRestore()
  })
})
