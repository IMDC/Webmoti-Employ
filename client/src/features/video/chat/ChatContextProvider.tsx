import { ReactNode, useRef } from 'react';
import { StoreApi } from 'zustand';
import { ChatStore, createChatStore } from './createChatStore';
import { ChatStoreContext } from './useChatStore';

interface ChatContextProviderProps {
  children: ReactNode;
}

export function ChatContextProvider({ children }: ChatContextProviderProps) {
  const storeRef = useRef<StoreApi<ChatStore> | null>(null);

  if (!storeRef.current) {
    // when this component is mounted, create chat store
    storeRef.current = createChatStore();
  }

  return <ChatStoreContext.Provider value={storeRef.current}>{children}</ChatStoreContext.Provider>;
}
