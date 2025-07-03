import { createContext, useContext } from 'react';
import { useStore, type StoreApi } from 'zustand';
import { ZoomSessionStore } from './createZoomSessionStore';

export const ZoomSessionContext = createContext<StoreApi<ZoomSessionStore> | null>(null);

export function useZoomSessionStore<T>(selector: (state: ZoomSessionStore) => T): T {
  const store = useContext(ZoomSessionContext);
  if (!store) {
    throw new Error('useZoomSessionStore must be used within a ZoomSessionContextProvider');
  }
  return useStore(store, selector);
}
