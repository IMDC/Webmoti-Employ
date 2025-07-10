import type { Json } from '@/types/Json'
import { create } from 'zustand'

type PermissionState = 'idle' | 'acquiring' | 'granted' | 'denied'

export interface AppError {
  message: string
  status?: number
  details?: Json
}

interface AppStore {
  error: AppError | null
  setError: (error: AppError | null) => void
  clearError: () => void

  // TODO move this to useZoomSessionStore
  isAudioOn: boolean
  isVideoOn: boolean
  setIsAudioOn: (value: boolean) => void
  setIsVideoOn: (value: boolean) => void
  toggleIsAudioOn: () => void
  toggleIsVideoOn: () => void

  permissionState: PermissionState
  setPermissionState: (value: PermissionState) => void

  isSettingsOpen: boolean
  setIsSettingsOpen: (value: boolean) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  error: null,
  setError: error => set({ error }),
  clearError: () => set({ error: null }),

  isAudioOn: true,
  isVideoOn: true,
  setIsAudioOn: value => set({ isAudioOn: value }),
  setIsVideoOn: value => set({ isVideoOn: value }),
  toggleIsAudioOn: () => set({ isAudioOn: !get().isAudioOn }),
  toggleIsVideoOn: () => set({ isVideoOn: !get().isVideoOn }),

  permissionState: 'idle',
  setPermissionState: value => set({ permissionState: value }),

  isSettingsOpen: false,
  setIsSettingsOpen: value => set({ isSettingsOpen: value }),
}))
