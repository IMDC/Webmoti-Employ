import { ReactNode, useState } from 'react';
import { StoreApi } from 'zustand';
import { createDeviceStore, DeviceStore } from './createDeviceStore';
import { DeviceContext } from './useDeviceStore';

interface DeviceContextProviderProps {
  children: ReactNode;
}

export function DeviceContextProvider({ children }: DeviceContextProviderProps) {
  const [store] = useState<StoreApi<DeviceStore>>(() => createDeviceStore());

  return <DeviceContext.Provider value={store}>{children}</DeviceContext.Provider>;
}
