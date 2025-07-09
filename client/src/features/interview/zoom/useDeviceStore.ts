import { createContext, useContext } from 'react';
import { useStore, type StoreApi } from 'zustand';
import { DeviceStore } from './createDeviceStore';

export const DeviceContext = createContext<StoreApi<DeviceStore> | null>(null);

export function useDeviceStore<T>(selector: (state: DeviceStore) => T): T {
  const store = useContext(DeviceContext);
  if (!store) {
    throw new Error('useDeviceStore must be used within a DeviceContextProvider');
  }
  return useStore(store, selector);
}
