import type { Session, User } from '@/lib/auth-client'
import { createStore } from 'zustand'

export interface UserStore {
  session: Session['session']
  user: User
}

export function createUserStore(session: Session) {
  if (!session.session) {
    throw new Error('Session not found')
  }
  if (!session.user) {
    throw new Error('User not found')
  }

  const userStore = createStore<UserStore>(() => ({
    session: session.session,
    user: session.user,
  }))

  return userStore
}
