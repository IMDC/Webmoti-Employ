import type { StoreApi } from 'zustand'
import type { ChatStore } from './createChatStore'
import { createContext, use } from 'react'
import { useStore } from 'zustand'

export const ChatStoreContext = createContext<StoreApi<ChatStore> | null>(null)

export function useChatStore<T>(selector: (state: ChatStore) => T): T {
  const store = use(ChatStoreContext)
  if (!store) {
    throw new Error('useChatStore must be used within a ChatContextProvider')
  }
  return useStore(store, selector)
}
