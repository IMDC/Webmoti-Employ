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
  const [store] = useState<StoreApi<ChatStore>>(() => createChatStore(zoomClient));

  useEffect(() => {
    return () => {
      store.getState().cleanup();
    };
  }, []);

  return <ChatStoreContext.Provider value={store}>{children}</ChatStoreContext.Provider>;
}
