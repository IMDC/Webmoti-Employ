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
    store.getState().initClient();

    return () => {
      store.getState().cleanup();
    };
  }, []);

  return <ZoomSessionContext.Provider value={store}>{children}</ZoomSessionContext.Provider>;
}
