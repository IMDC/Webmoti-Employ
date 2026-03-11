import type { StoreApi } from 'zustand'
import type { UserStore } from './createUserStore'
import { createContext, use } from 'react'
import { useStore } from 'zustand'

export const UserStoreContext = createContext<StoreApi<UserStore> | null>(null)

function useUserStoreApi() {
  const store = use(UserStoreContext)
  if (!store) {
    throw new Error('useUserStoreApi must be used within a UserContextProvider')
  }
  return store
}

function useUserStore<T>(selector: (state: UserStore) => T): T {
  return useStore(useUserStoreApi(), selector)
}

export const useUser = () => useUserStore(s => s.user)
export const useSession = () => useUserStore(s => s.session)

export function useUpdateUser() {
  const store = useUserStoreApi()
  return (updates: Partial<UserStore['user']>) => {
    store.setState(state => ({ user: { ...state.user, ...updates } }))
  }
}
