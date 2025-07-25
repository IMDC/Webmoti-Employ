import { create } from 'zustand'

export type PermissionState = 'idle' | 'acquiring' | 'granted' | 'denied'

export interface AppError {
  message: string
  status?: number
  details?: unknown
}

interface AppActions {
  setError: (error: AppError | null) => void
  clearError: () => void
  setPermissionState: (value: PermissionState) => void
  setIsSettingsOpen: (value: boolean) => void
  setIsColorblindModeOn: (value: boolean) => void
}

interface AppStore {
  error: AppError | null
  permissionState: PermissionState
  isSettingsOpen: boolean
  isColorblindModeOn: boolean
  actions: AppActions
}

export const useAppStore = create<AppStore>(set => ({
  error: null,
  permissionState: 'idle',
  isSettingsOpen: false,
  isColorblindModeOn: false,

  actions: {
    setError: error => set({ error }),
    clearError: () => set({ error: null }),
    setPermissionState: value => set({ permissionState: value }),
    setIsColorblindModeOn: value => set({ isColorblindModeOn: value }),
    setIsSettingsOpen: value => set({ isSettingsOpen: value }),
  },
}))

export const useAppActions = () => useAppStore(s => s.actions)
export const useAppError = () => useAppStore(s => s.error)
export const useAppPermissionState = () => useAppStore(s => s.permissionState)
export const useAppIsSettingsOpen = () => useAppStore(s => s.isSettingsOpen)
export const useAppIsColorblindModeOn = () => useAppStore(s => s.isColorblindModeOn)
