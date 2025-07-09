import { ReactNode, useContext, useEffect, useState } from 'react';
import { StoreApi } from 'zustand';
import { createZoomSessionStore, ZoomSessionStore } from './createZoomSessionStore';
import { DeviceContext } from './useDeviceStore';
import { ZoomSessionContext } from './useZoomSessionStore';

interface ZoomSessionContextProviderProps {
  children: ReactNode;
}

export function ZoomSessionContextProvider({ children }: ZoomSessionContextProviderProps) {
  const deviceStore = useContext(DeviceContext);
  if (!deviceStore) {
    throw new Error('ZoomSessionContextProvider must be used within a DeviceContextProvider');
  }

  const [store] = useState<StoreApi<ZoomSessionStore>>(() => createZoomSessionStore(deviceStore));

  useEffect(() => {
    store.getState().initClient();

    return () => {
      store.getState().cleanup();
    };
  }, [store]);

  return <ZoomSessionContext.Provider value={store}>{children}</ZoomSessionContext.Provider>;
}
