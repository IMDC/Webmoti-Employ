import type { ReactNode } from 'react'
import type { StoreApi } from 'zustand'
import type { ChatStore } from './createChatStore'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAppActions } from '@/useAppStore'
import { handleAppError } from '@/utils/utils'
import { useZoomSessionClient } from '../zoom/useZoomSessionStore'
import { createChatStore } from './createChatStore'
import { ChatStoreContext } from './useChatStore'

interface ChatContextProviderProps {
  children: ReactNode
}

export function ChatContextProvider({ children }: ChatContextProviderProps) {
  const zoomClient = useZoomSessionClient()
  const [store, setStore] = useState<StoreApi<ChatStore>>()

  const { setError } = useAppActions()

  const { id } = useParams({ from: '/(authenticated)/interview/$id' })
  const navigate = useNavigate()

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
      navigate({ to: '/end/$id', params: { id } })
    }

    return () => {
      chatStore?.getState().actions.cleanup()
    }
  }, [zoomClient, setError, id, navigate])

  if (!store) {
    return null
  }

  return <ChatStoreContext value={store}>{children}</ChatStoreContext>
}
