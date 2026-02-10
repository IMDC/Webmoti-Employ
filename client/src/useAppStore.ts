import { createStore, useStore } from 'zustand'

export type PermissionState = 'idle' | 'acquiring' | 'granted' | 'denied'

interface AppActions {
  setPermissionState: (value: PermissionState) => void
  setIsSettingsOpen: (value: boolean) => void
  setIsColorblindModeOn: (value: boolean) => void
}

interface AppStore {
  permissionState: PermissionState
  isSettingsOpen: boolean
  isColorblindModeOn: boolean
  actions: AppActions
}

export const appStore = createStore<AppStore>(set => ({
  permissionState: 'idle',
  isSettingsOpen: false,
  isColorblindModeOn: false,

  actions: {
    setPermissionState: value => set({ permissionState: value }),
    setIsColorblindModeOn: value => set({ isColorblindModeOn: value }),
    setIsSettingsOpen: value => set({ isSettingsOpen: value }),
  },
}))

const useAppStore = <T>(selector: (state: AppStore) => T): T => useStore(appStore, selector)

export const useAppActions = () => useAppStore(s => s.actions)
export const useAppPermissionState = () => useAppStore(s => s.permissionState)
export const useAppIsSettingsOpen = () => useAppStore(s => s.isSettingsOpen)
export const useAppIsColorblindModeOn = () => useAppStore(s => s.isColorblindModeOn)
