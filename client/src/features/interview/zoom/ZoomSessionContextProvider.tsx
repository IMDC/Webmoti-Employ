import { ReactNode, useEffect, useState } from 'react';
import { StoreApi } from 'zustand';
import { createZoomSessionStore, ZoomSessionStore } from './createZoomSessionStore';
import { ZoomSessionContext } from './useZoomSessionStore';

interface ZoomSessionContextProviderProps {
  children: ReactNode;
}

export function ZoomSessionContextProvider({ children }: ZoomSessionContextProviderProps) {
  const [store] = useState<StoreApi<ZoomSessionStore>>(() => createZoomSessionStore());

  useEffect(() => {
    return () => {
      const current = store.getState();
      (async () => {
        await current.cleanup();
      })();
    };
  }, [store]);

  if (!store) {
    return null;
  }

  return <ZoomSessionContext.Provider value={store}>{children}</ZoomSessionContext.Provider>;
}
