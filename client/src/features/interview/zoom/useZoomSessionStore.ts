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
export const useLocalUserId = () => useZoomSessionStore(s => s.localUserId)
export const useActiveSpeakerUserId = () => useZoomSessionStore(s => s.activeSpeakerUserId)
export const useRoomName = () => useZoomSessionStore(s => s.roomName)
// subscribe to a single participant’s network level
export function useParticipantNetworkLevel(userId: number | null) {
  return useZoomSessionStore(state =>
    userId != null ? state.networkLevels.get(userId) ?? null : null,
  )
}
