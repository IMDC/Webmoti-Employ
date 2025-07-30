import type { StoreApi } from 'zustand'
import type { UserStore } from './createUserStore'
import { createContext, use } from 'react'
import { useStore } from 'zustand'

export const UserStoreContext = createContext<StoreApi<UserStore> | null>(null)

function useUserStore<T>(selector: (state: UserStore) => T): T {
  const store = use(UserStoreContext)
  if (!store) {
    throw new Error('useUserStore must be used within a UserContextProvider')
  }
  return useStore(store, selector)
}

export const useUser = () => useUserStore(s => s.user)
export const useSession = () => useUserStore(s => s.session)
