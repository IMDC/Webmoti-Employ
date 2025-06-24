import { ReactNode, useRef } from 'react';
import { StoreApi } from 'zustand';
import { createZoomSessionStore, ZoomSessionStore } from './createZoomSessionStore';
import { ZoomSessionContext } from './useZoomSessionStore';

interface ZoomSessionContextProviderProps {
  children: ReactNode;
}

export function ZoomSessionContextProvider({ children }: ZoomSessionContextProviderProps) {
  const storeRef = useRef<StoreApi<ZoomSessionStore> | null>(null);

  // TODO add cleanup with useeffect
  if (!storeRef.current) {
    storeRef.current = createZoomSessionStore();
  }

  return (
    <ZoomSessionContext.Provider value={storeRef.current}>{children}</ZoomSessionContext.Provider>
  );
}
