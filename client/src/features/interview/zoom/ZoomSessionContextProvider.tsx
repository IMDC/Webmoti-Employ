import type { ReactNode } from 'react'
import type { StoreApi } from 'zustand'
import type { ZoomSessionStore } from './createZoomSessionStore'
import { use, useEffect, useState } from 'react'
import { createZoomSessionStore } from './createZoomSessionStore'
import { DeviceContext } from './useDeviceStore'
import { ZoomSessionContext } from './useZoomSessionStore'

interface ZoomSessionContextProviderProps {
  children: ReactNode
}

export function ZoomSessionContextProvider({ children }: ZoomSessionContextProviderProps) {
  const deviceStore = use(DeviceContext)
  if (!deviceStore) {
    throw new Error('ZoomSessionContextProvider must be used within a DeviceContextProvider')
  }

  const [store] = useState<StoreApi<ZoomSessionStore>>(() => createZoomSessionStore(deviceStore))

  useEffect(() => {
    store.getState().initClient()

    return () => {
      store.getState().cleanup()
    }
  }, [store])

  return <ZoomSessionContext value={store}>{children}</ZoomSessionContext>
}
