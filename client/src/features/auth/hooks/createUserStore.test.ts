import { makeSession, makeUser } from '@test-utils'
import { createUserStore } from './createUserStore'

describe('createUserStore', () => {
  it('creates a store with session and user', () => {
    const session = makeSession()
    const store = createUserStore(session)
    const state = store.getState()

    expect(state.session.id).toBe('test-session-id')
    expect(state.user.id).toBe('test-user-id')
    expect(state.user.email).toBe('test@torontomu.ca')
  })

  it('throws when session is missing', () => {
    expect(() =>
      createUserStore({ session: null as any, user: makeUser() }),
    ).toThrow('Session not found')
  })

  it('throws when user is missing', () => {
    const session = makeSession()
    expect(() =>
      createUserStore({ session: session.session, user: null as any }),
    ).toThrow('User not found')
  })
})
