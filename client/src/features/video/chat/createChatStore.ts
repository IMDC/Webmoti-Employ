import { ChatClient, ChatMessage } from '@zoom/videosdk';
import { create } from 'zustand';
import { useZoomVideoStore } from '@/stores/ZoomVideoStore';

export type ChatStore = {
  chatClient: typeof ChatClient;
  messages: Array<ChatMessage>;
  isChatUnread: boolean;

  sendChat: (messageText: string) => Promise<void>;
};

export function createChatStore() {
  const zoomClient = useZoomVideoStore.getState().client;
  const chatClient = zoomClient.getChatClient();

  // initialize messages
  // (this doesn't work since zoom sdk doesn't store/sync old chat messages)
  // https://developers.zoom.us/docs/video-sdk/web/chat/#get-chat-history
  const messages = chatClient.getHistory();

  const chatStore = create<ChatStore>(() => ({
    chatClient,
    messages,
    isChatUnread: false,

    sendChat: async (messageText) => {
      await chatClient.sendToAll(messageText);
    },
  }));

  zoomClient.on('chat-on-message', (message) => {
    chatStore.setState((s) => ({
      messages: [...s.messages, message],
    }));
  });

  return chatStore;
}
