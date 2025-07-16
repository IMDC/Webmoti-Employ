import type { ReactNode } from 'react'
import type { StoreApi } from 'zustand'
import type { PreviewStore } from '../createPreviewStore'
import { use, useState } from 'react'
import { DeviceContext } from '@/features/interview/zoom/useDeviceStore'
import { ZoomSessionContext } from '../../zoom/useZoomSessionStore'
import { createPreviewStore } from '../createPreviewStore'
import { PreviewContext } from '../hooks/usePreviewStore'

interface PreviewContextProviderProps {
  children: ReactNode
}

export function PreviewContextProvider({ children }: PreviewContextProviderProps) {
  const deviceStore = use(DeviceContext)
  if (!deviceStore) {
    throw new Error('PreviewContextProvider must be used within a DeviceContextProvider')
  }

  const zoomSessionStore = use(ZoomSessionContext)
  if (!zoomSessionStore) {
    throw new Error('PreviewContextProvider must be used within a ZoomSessionContextProvider')
  }

  const [store] = useState<StoreApi<PreviewStore>>(
    () => createPreviewStore(deviceStore, zoomSessionStore),
  )

  return <PreviewContext value={store}>{children}</PreviewContext>
}
