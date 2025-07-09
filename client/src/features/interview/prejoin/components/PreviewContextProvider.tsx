import { ReactNode, useContext, useState } from 'react';
import { StoreApi } from 'zustand';
import { DeviceContext } from '@/features/interview/zoom/useDeviceStore';
import { createPreviewStore, PreviewStore } from '../createPreviewStore';
import { PreviewContext } from '../hooks/usePreviewStore';

interface PreviewContextProviderProps {
  children: ReactNode;
}

export function PreviewContextProvider({ children }: PreviewContextProviderProps) {
  const deviceStore = useContext(DeviceContext);
  if (!deviceStore) {
    throw new Error('PreviewContextProvider must be used within a DeviceContextProvider');
  }

  const [store] = useState<StoreApi<PreviewStore>>(() => createPreviewStore(deviceStore));

  return <PreviewContext.Provider value={store}>{children}</PreviewContext.Provider>;
}
