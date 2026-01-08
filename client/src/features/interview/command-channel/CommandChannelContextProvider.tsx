import type { ReactNode } from 'react'
import type { StoreApi } from 'zustand'
import type { CommandChannelStore } from './createCommandChannelStore'
import { useEffect, useState } from 'react'
import { useAppActions } from '@/useAppStore'
import { handleAppError } from '@/utils/utils'
import { useZoomSessionClient } from '../zoom/useZoomSessionStore'
import { createCommandChannelStore } from './createCommandChannelStore'
import { CommandChannelStoreContext } from './useCommandChannelStore'

interface CommandChannelContextProviderProps {
  children: ReactNode
}

export function CommandChannelContextProvider({ children }: CommandChannelContextProviderProps) {
  const zoomClient = useZoomSessionClient()
  const [store, setStore] = useState<StoreApi<CommandChannelStore>>()

  const { setError } = useAppActions()

  useEffect(() => {
    if (!zoomClient) {
      return
    }

    let commandChannelStore: StoreApi<CommandChannelStore> | null = null
    try {
      commandChannelStore = createCommandChannelStore(zoomClient)
      setStore(commandChannelStore)
    }
    catch (error) {
      handleAppError(error, setError, 'Failed to join command channel')
    }

    return () => {
      commandChannelStore?.getState().actions.cleanup()
    }
  }, [zoomClient, setError])

  if (!store) {
    return null
  }

  return <CommandChannelStoreContext value={store}>{children}</CommandChannelStoreContext>
}
