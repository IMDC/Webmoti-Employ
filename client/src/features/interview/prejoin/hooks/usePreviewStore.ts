import type { StoreApi } from 'zustand'
import type { PreviewStore } from '../createPreviewStore'
import { createContext, use } from 'react'
import { useStore } from 'zustand'

export const PreviewContext = createContext<StoreApi<PreviewStore> | null>(null)

export function usePreviewStore<T>(selector: (state: PreviewStore) => T): T {
  const store = use(PreviewContext)
  if (!store) {
    throw new Error('usePreviewStore must be used within a PreviewContextProvider')
  }
  return useStore(store, selector)
}
