import type { StoreApi } from 'zustand'
import type { ZoomSessionStore } from './createZoomSessionStore'
import { createContext, use } from 'react'
import { useStore } from 'zustand'

export const ZoomSessionContext = createContext<StoreApi<ZoomSessionStore> | null>(null)

export function useZoomSessionStore<T>(selector: (state: ZoomSessionStore) => T): T {
  const store = use(ZoomSessionContext)
  if (!store) {
    throw new Error('useZoomSessionStore must be used within a ZoomSessionContextProvider')
  }
  return useStore(store, selector)
}
