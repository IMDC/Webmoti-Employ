import { createContext, useContext } from 'react';
import { useStore, type StoreApi } from 'zustand';
import { PreviewStore } from '../createPreviewStore';

export const PreviewContext = createContext<StoreApi<PreviewStore> | null>(null);

export function usePreviewStore<T>(selector: (state: PreviewStore) => T): T {
  const store = useContext(PreviewContext);
  if (!store) {
    throw new Error('usePreviewStore must be used within a PreviewContextProvider');
  }
  return useStore(store, selector);
}
