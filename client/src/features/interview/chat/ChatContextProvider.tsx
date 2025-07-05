import { ReactNode, useEffect, useState } from 'react';
import { StoreApi } from 'zustand';
import { useZoomSessionStore } from '../zoom/useZoomSessionStore';
import { ChatStore, createChatStore } from './createChatStore';
import { ChatStoreContext } from './useChatStore';

interface ChatContextProviderProps {
  children: ReactNode;
}

export function ChatContextProvider({ children }: ChatContextProviderProps) {
  const zoomClient = useZoomSessionStore((s) => s.client);
  const [store, setStore] = useState<StoreApi<ChatStore>>();

  useEffect(() => {
    if (!zoomClient) {
      return;
    }

    const chatStore = createChatStore(zoomClient);
    setStore(chatStore);

    return () => {
      chatStore.getState().cleanup();
    };
  }, [zoomClient]);

  if (!store) {
    return null;
  }

  return <ChatStoreContext.Provider value={store}>{children}</ChatStoreContext.Provider>;
}
