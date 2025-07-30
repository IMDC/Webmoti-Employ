import type { ReactNode } from 'react'
import type { StoreApi } from 'zustand'
import type { UserStore } from '../hooks/createUserStore'
import type { Session } from '@/lib/auth-client'
import { useState } from 'react'
import { createUserStore } from '../hooks/createUserStore'
import { UserStoreContext } from '../hooks/useUserStore'

interface UserContextProviderProps {
  session: Session
  children: ReactNode
}

export function UserContextProvider({ session, children }: UserContextProviderProps) {
  const [store] = useState<StoreApi<UserStore>>(() => createUserStore(session))

  return <UserStoreContext value={store}>{children}</UserStoreContext>
}
