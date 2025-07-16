import { create } from 'zustand'

export type PermissionState = 'idle' | 'acquiring' | 'granted' | 'denied'

export interface AppError {
  message: string
  status?: number
  details?: unknown
}

interface AppStore {
  error: AppError | null
  setError: (error: AppError | null) => void
  clearError: () => void

  permissionState: PermissionState
  setPermissionState: (value: PermissionState) => void

  isSettingsOpen: boolean
  setIsSettingsOpen: (value: boolean) => void
  isColorblindModeOn: boolean
  setIsColorblindModeOn: (value: boolean) => void
}

export const useAppStore = create<AppStore>(set => ({
  error: null,
  setError: error => set({ error }),
  clearError: () => set({ error: null }),

  permissionState: 'idle',
  setPermissionState: value => set({ permissionState: value }),

  isSettingsOpen: false,
  setIsSettingsOpen: value => set({ isSettingsOpen: value }),
  isColorblindModeOn: false,
  setIsColorblindModeOn: value => set({ isColorblindModeOn: value }),
}))
