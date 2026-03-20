import type { ReactNode } from 'react'
import type { StoreApi } from 'zustand'
import type { PreviewStore } from '../createPreviewStore'
import { use, useEffect, useState } from 'react'
import { DeviceContext } from '@/features/interview/zoom/useDeviceStore'
import { logger } from '@/utils/logger'
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

  // follow system default when devices change on the prejoin screen
  useEffect(() => {
    const handler = async () => {
      await deviceStore.getState().actions.refreshDevices()

      const { selectedAudioInputDevice } = deviceStore.getState()
      const { localAudioTrack } = store.getState()

      // re-create the preview mic track so it picks up the new system default
      if (selectedAudioInputDevice === 'default' && localAudioTrack) {
        try {
          await store.getState().actions.switchMicrophone('default')
        }
        catch (error) {
          logger.warn('Failed to follow default microphone on prejoin', error)
        }
      }
    }

    navigator.mediaDevices.addEventListener('devicechange', handler)
    return () => navigator.mediaDevices.removeEventListener('devicechange', handler)
  }, [deviceStore, store])

  return <PreviewContext value={store}>{children}</PreviewContext>
}
