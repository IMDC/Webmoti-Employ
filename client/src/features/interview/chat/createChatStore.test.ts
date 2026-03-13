import type { ChatMessage } from '@zoom/videosdk'
import { createChatStore } from './createChatStore'

function makeMockZoomClient() {
  const listeners = new Map<string, ((...args: unknown[]) => void)[]>()

  const chatClient = {
    getHistory: vi.fn().mockReturnValue([]),
    sendToAll: vi.fn().mockResolvedValue(undefined),
  }

  return {
    getChatClient: () => chatClient,
    getCurrentUserInfo: () => ({ userId: 1 }),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners.has(event))
        listeners.set(event, [])
      listeners.get(event)!.push(handler)
    }),
    off: vi.fn(),
    // Helper to emit events in tests
    _emit: (event: string, payload: any) => {
      listeners.get(event)?.forEach(fn => fn(payload))
    },
    _chatClient: chatClient,
  }
}

describe('createChatStore', () => {
  it('initializes with empty messages and unread false', () => {
    const mockClient = makeMockZoomClient()
    const store = createChatStore(mockClient as any)
    const state = store.getState()

    expect(state.messages).toEqual([])
    expect(state.isChatUnread).toBe(false)
  })

  it('adds messages on chat-on-message event', () => {
    const mockClient = makeMockZoomClient()
    const store = createChatStore(mockClient as any)

    const message = {
      message: 'Hello!',
      sender: { userId: 2, name: 'Other User' },
      timestamp: Date.now(),
    } as unknown as ChatMessage

    mockClient._emit('chat-on-message', message)

    expect(store.getState().messages).toHaveLength(1)
    expect(store.getState().messages[0]).toBe(message)
  })

  it('marks chat as unread when message is from another user', () => {
    const mockClient = makeMockZoomClient()
    const store = createChatStore(mockClient as any)

    mockClient._emit('chat-on-message', {
      message: 'Hello!',
      sender: { userId: 2, name: 'Other' },
      timestamp: Date.now(),
    })

    expect(store.getState().isChatUnread).toBe(true)
  })

  it('does not mark chat as unread for own messages', () => {
    const mockClient = makeMockZoomClient()
    const store = createChatStore(mockClient as any)

    mockClient._emit('chat-on-message', {
      message: 'My message',
      sender: { userId: 1, name: 'Me' }, // matches getCurrentUserInfo
      timestamp: Date.now(),
    })

    expect(store.getState().isChatUnread).toBe(false)
  })

  it('setChatRead clears unread flag', () => {
    const mockClient = makeMockZoomClient()
    const store = createChatStore(mockClient as any)

    mockClient._emit('chat-on-message', {
      message: 'Hello!',
      sender: { userId: 2, name: 'Other' },
      timestamp: Date.now(),
    })
    expect(store.getState().isChatUnread).toBe(true)

    store.getState().actions.setChatRead()
    expect(store.getState().isChatUnread).toBe(false)
  })

  it('sendChat calls chatClient.sendToAll', async () => {
    const mockClient = makeMockZoomClient()
    const store = createChatStore(mockClient as any)

    await store.getState().actions.sendChat('Test message')

    expect(mockClient._chatClient.sendToAll).toHaveBeenCalledWith('Test message')
  })

  it('cleanup removes event listener', () => {
    const mockClient = makeMockZoomClient()
    const store = createChatStore(mockClient as any)

    store.getState().actions.cleanup()

    expect(mockClient.off).toHaveBeenCalledWith('chat-on-message', expect.any(Function))
  })
})
