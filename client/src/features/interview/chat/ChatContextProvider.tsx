import type { ReactNode } from 'react'
import type { StoreApi } from 'zustand'
import type { ChatStore } from './createChatStore'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/useAppStore'
import { handleAppError } from '@/utils/utils'
import { useZoomSessionStore } from '../zoom/useZoomSessionStore'
import { createChatStore } from './createChatStore'
import { ChatStoreContext } from './useChatStore'

interface ChatContextProviderProps {
  children: ReactNode
}

export function ChatContextProvider({ children }: ChatContextProviderProps) {
  const zoomClient = useZoomSessionStore(s => s.client)
  const [store, setStore] = useState<StoreApi<ChatStore>>()

  const setError = useAppStore(s => s.setError)

  useEffect(() => {
    if (!zoomClient) {
      return
    }

    let chatStore: StoreApi<ChatStore> | null = null
    try {
      chatStore = createChatStore(zoomClient)
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setStore(chatStore)
    }
    catch (error) {
      handleAppError(error, setError, 'Failed to join chat session')
    }

    return () => {
      chatStore?.getState().cleanup()
    }
  }, [zoomClient, setError])

  if (!store) {
    return null
  }

  return <ChatStoreContext value={store}>{children}</ChatStoreContext>
}
