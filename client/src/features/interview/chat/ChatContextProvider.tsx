import type { ReactNode } from 'react'
import type { StoreApi } from 'zustand'
import type { ChatStore } from './createChatStore'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { notifyError } from '@/utils/utils'
import { useZoomSessionClient } from '../zoom/useZoomSessionStore'
import { createChatStore } from './createChatStore'
import { ChatStoreContext } from './useChatStore'

interface ChatContextProviderProps {
  children: ReactNode
}

export function ChatContextProvider({ children }: ChatContextProviderProps) {
  const zoomClient = useZoomSessionClient()
  const [store, setStore] = useState<StoreApi<ChatStore>>()

  const { id } = useParams({ from: '/(authenticated)/interview/$id' })
  const navigate = useNavigate()

  useEffect(() => {
    if (!zoomClient) {
      return
    }

    let chatStore: StoreApi<ChatStore> | null = null
    try {
      chatStore = createChatStore(zoomClient)
      setStore(chatStore)
    }
    catch (error) {
      notifyError('Failed to join chat session', error)
      navigate({ to: '/end/$id', params: { id } })
    }

    return () => {
      chatStore?.getState().actions.cleanup()
    }
  }, [zoomClient, id, navigate])

  if (!store) {
    return null
  }

  return <ChatStoreContext value={store}>{children}</ChatStoreContext>
}
