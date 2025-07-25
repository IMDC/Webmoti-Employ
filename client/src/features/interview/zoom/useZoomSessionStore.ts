import type { StoreApi } from 'zustand'
import type { ZoomSessionStore } from './createZoomSessionStore'
import { createContext, use } from 'react'
import { useStore } from 'zustand'

export const ZoomSessionContext = createContext<StoreApi<ZoomSessionStore> | null>(null)

function useZoomSessionStore<T>(selector: (state: ZoomSessionStore) => T): T {
  const store = use(ZoomSessionContext)
  if (!store) {
    throw new Error('useZoomSessionStore must be used within a ZoomSessionContextProvider')
  }
  return useStore(store, selector)
}

export const useZoomSessionActions = () => useZoomSessionStore(s => s.actions)
export const useZoomCallState = () => useZoomSessionStore(s => s.callState)
export const useZoomParticipants = () => useZoomSessionStore(s => s.participants)
export const useIsVideoOn = () => useZoomSessionStore(s => s.isVideoOn)
export const useIsAudioOn = () => useZoomSessionStore(s => s.isAudioOn)
export const useZoomSessionClient = () => useZoomSessionStore(s => s.client)
