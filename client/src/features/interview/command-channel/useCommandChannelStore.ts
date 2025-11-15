import type { StoreApi } from 'zustand'
import type { CommandChannelStore } from './createCommandChannelStore'
import { createContext, use } from 'react'
import { useStore } from 'zustand'

export const CommandChannelStoreContext = createContext<StoreApi<CommandChannelStore> | null>(null)

function useCommandChannelStore<T>(selector: (state: CommandChannelStore) => T): T {
  const store = use(CommandChannelStoreContext)
  if (!store) {
    throw new Error('useCommandChannelStore must be used within a CommandChannelContextProvider')
  }
  return useStore(store, selector)
}

export const useCommandChannelActions = () => useCommandChannelStore(s => s.actions)
export const useCommandChannelMessages = () => useCommandChannelStore(s => s.messages)
export const useCommandChannelConnected = () => useCommandChannelStore(s => s.isConnected)
