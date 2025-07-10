import type { ReactNode } from 'react'
import type { StoreApi } from 'zustand'
import type { ChatStore } from './createChatStore'
import { useEffect, useState } from 'react'
import { useZoomSessionStore } from '../zoom/useZoomSessionStore'
import { createChatStore } from './createChatStore'
import { ChatStoreContext } from './useChatStore'

interface ChatContextProviderProps {
  children: ReactNode
}

export function ChatContextProvider({ children }: ChatContextProviderProps) {
  const zoomClient = useZoomSessionStore(s => s.client)
  const [store, setStore] = useState<StoreApi<ChatStore>>()

  useEffect(() => {
    if (!zoomClient) {
      return
    }

    const chatStore = createChatStore(zoomClient)
    setStore(chatStore)

    return () => {
      chatStore.getState().cleanup()
    }
  }, [zoomClient])

  if (!store) {
    return null
  }

  return <ChatStoreContext value={store}>{children}</ChatStoreContext>
}
