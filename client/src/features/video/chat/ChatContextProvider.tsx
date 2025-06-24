import { ReactNode, useRef } from 'react';
import { StoreApi } from 'zustand';
import { useZoomSessionStore } from '../zoom/useZoomSessionStore';
import { ChatStore, createChatStore } from './createChatStore';
import { ChatStoreContext } from './useChatStore';

interface ChatContextProviderProps {
  children: ReactNode;
}

export function ChatContextProvider({ children }: ChatContextProviderProps) {
  const zoomClient = useZoomSessionStore((s) => s.client);
  const storeRef = useRef<StoreApi<ChatStore> | null>(null);

  if (!storeRef.current) {
    // when this component is mounted, create chat store
    storeRef.current = createChatStore(zoomClient);
  }

  return <ChatStoreContext.Provider value={storeRef.current}>{children}</ChatStoreContext.Provider>;
}
