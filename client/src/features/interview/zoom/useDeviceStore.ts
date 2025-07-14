import type { StoreApi } from 'zustand'
import type { DeviceStore } from './createDeviceStore'
import { createContext, use } from 'react'
import { useStore } from 'zustand'

export const DeviceContext = createContext<StoreApi<DeviceStore> | null>(null)

export function useDeviceStore<T>(selector: (state: DeviceStore) => T): T {
  const store = use(DeviceContext)
  if (!store) {
    throw new Error('useDeviceStore must be used within a DeviceContextProvider')
  }
  return useStore(store, selector)
}
