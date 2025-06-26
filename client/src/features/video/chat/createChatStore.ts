import { ChatClient, ChatMessage, VideoClient } from '@zoom/videosdk';
import { create, createStore } from 'zustand';

export type ChatStore = {
  chatClient: typeof ChatClient;
  messages: Array<ChatMessage>;
  isChatUnread: boolean;

  sendChat: (messageText: string) => Promise<void>;

  cleanup: () => void;
};

export function createChatStore(zoomClient: typeof VideoClient) {
  const chatClient = zoomClient.getChatClient();

  // initialize messages
  // (this doesn't work since zoom sdk doesn't store/sync old chat messages)
  // https://developers.zoom.us/docs/video-sdk/web/chat/#get-chat-history
  const messages = chatClient.getHistory();

  const handleMessage = (message: ChatMessage) => {
    chatStore.setState((s) => ({
      messages: [...s.messages, message],
    }));
  };

  const chatStore = createStore<ChatStore>(() => ({
    chatClient,
    messages,
    isChatUnread: false,

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
