import type { StoreApi } from 'zustand'
import type { DeviceStore } from './createDeviceStore'
import { createContext, use } from 'react'
import { useStore } from 'zustand'

export const DeviceContext = createContext<StoreApi<DeviceStore> | null>(null)

function useDeviceStore<T>(selector: (state: DeviceStore) => T): T {
  const store = use(DeviceContext)
  if (!store) {
    throw new Error('useDeviceStore must be used within a DeviceContextProvider')
  }
  return useStore(store, selector)
}

export const useDeviceStoreActions = () => useDeviceStore(s => s.actions)
export const useVideoDevices = () => useDeviceStore(s => s.videoDevices)
export const useAudioInputDevices = () => useDeviceStore(s => s.audioInputDevices)
export const useAudioOutputDevices = () => useDeviceStore(s => s.audioOutputDevices)
export const useSelectedVideoDevice = () => useDeviceStore(s => s.selectedVideoDevice)
export const useSelectedAudioInputDevice = () => useDeviceStore(s => s.selectedAudioInputDevice)
export const useSelectedAudioOutputDevice = () => useDeviceStore(s => s.selectedAudioOutputDevice)
