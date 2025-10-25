import type { Session, User } from '@/lib/auth-client'
import { createStore } from 'zustand'
import { logger } from '@/utils/logger'

export interface UserStore {
  session: Session['session']
  user: User
  devIsJohnDoNotUseThis: boolean
  actions: {
    setDevIsJohnDoNotUseThis: (isJohn: boolean) => void
  }
}

export function createUserStore(session: Session) {
  if (!session.session) {
    throw new Error('Session not found')
  }
  if (!session.user) {
    throw new Error('User not found')
  }

  const userStore = createStore<UserStore>(set => ({
    session: session.session,
    user: session.user,
    devIsJohnDoNotUseThis: false,
    actions: {
      setDevIsJohnDoNotUseThis: (isJohn) => {
        logger.log('Dev John:', isJohn)
        set({ devIsJohnDoNotUseThis: isJohn })
      },
    },
  }))

  return userStore
}
