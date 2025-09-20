import type { CommandChannel, VideoClient } from '@zoom/videosdk'
import { createStore } from 'zustand'

export interface CommandChannelMessage {
  senderId: string
  senderName: string
  text: string
  timestamp: number
  msgid: string
}

export interface CommandChannelStoreActions {
  sendMessage: (text: string, userId?: number) => Promise<void>
  cleanup: () => void
}

export interface CommandChannelStore {
  commandChannelClient: typeof CommandChannel
  messages: Array<CommandChannelMessage>
  isConnected: boolean
  actions: CommandChannelStoreActions
}

export function createCommandChannelStore(zoomClient: typeof VideoClient) {
  const commandChannelClient = zoomClient.getCommandClient()

  const commandChannelStore = createStore<CommandChannelStore>(() => ({
    commandChannelClient,
    messages: [],
    isConnected: false,
    actions: {
      sendMessage: async (text: string, userId?: number) => {
        try {
          await commandChannelClient.send(text, userId)
        }
        catch (error) {
          console.error('Failed to send command channel message:', error)
        }
      },
      cleanup: () => {
        zoomClient.off('command-channel-message', handleMessage)
        zoomClient.off('command-channel-status', handleStatus)
      },
    },
  }))

  function handleMessage(payload: CommandChannelMessage) {
    commandChannelStore.setState(state => ({
      messages: [...state.messages, payload],
    }))
  }

  function handleStatus(payload: { status: string }) {
    commandChannelStore.setState({ isConnected: payload.status === 'connected' })
  }

  // Add event listeners
  zoomClient.on('command-channel-message', handleMessage)
  zoomClient.on('command-channel-status', handleStatus)

  return commandChannelStore
}
