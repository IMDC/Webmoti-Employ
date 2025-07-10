import type { ReactNode } from 'react'
import type { StoreApi } from 'zustand'
import type { DeviceStore } from './createDeviceStore'
import { useState } from 'react'
import { createDeviceStore } from './createDeviceStore'
import { DeviceContext } from './useDeviceStore'

interface DeviceContextProviderProps {
  children: ReactNode
}

export function DeviceContextProvider({ children }: DeviceContextProviderProps) {
  const [store] = useState<StoreApi<DeviceStore>>(() => createDeviceStore())

  return <DeviceContext value={store}>{children}</DeviceContext>
}
