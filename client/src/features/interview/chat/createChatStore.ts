import { ChatClient, ChatMessage, VideoClient } from '@zoom/videosdk';
import { createStore } from 'zustand';

export type ChatStore = {
  chatClient: typeof ChatClient;
  messages: Array<ChatMessage>;
  isChatUnread: boolean;
  setChatRead: () => void;

  sendChat: (messageText: string) => Promise<void>;

  cleanup: () => void;
};

export function createChatStore(zoomClient: typeof VideoClient) {
  const chatClient = zoomClient.getChatClient();
  const currentUserId = zoomClient.getCurrentUserInfo().userId;

  // initialize messages
  // (this doesn't work since zoom sdk doesn't store/sync old chat messages)
  // https://developers.zoom.us/docs/video-sdk/web/chat/#get-chat-history
  const messages = chatClient.getHistory();

  const handleMessage = (message: ChatMessage) => {
    chatStore.setState((s) => ({
      messages: [...s.messages, message],
      isChatUnread: message.sender.userId !== currentUserId,
    }));
  };

  const chatStore = createStore<ChatStore>((set) => ({
    chatClient,
    messages,
    isChatUnread: false,
    setChatRead: () => {
      set({ isChatUnread: false });
    },

    sendChat: async (messageText) => {
      await chatClient.sendToAll(messageText);
    },
    cleanup: () => {
      zoomClient.off('chat-on-message', handleMessage);
    },
  }));

  zoomClient.on('chat-on-message', handleMessage);

  return chatStore;
}
