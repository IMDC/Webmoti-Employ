import { createCommandChannelStore } from './createCommandChannelStore'

function makeMockZoomClient() {
  const listeners = new Map<string, ((...args: unknown[]) => void)[]>()

  const commandClient = {
    send: vi.fn().mockResolvedValue(undefined),
  }

  return {
    getCommandClient: () => commandClient,
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners.has(event))
        listeners.set(event, [])
      listeners.get(event)!.push(handler)
    }),
    off: vi.fn(),
    _emit: (event: string, payload: any) => {
      listeners.get(event)?.forEach(fn => fn(payload))
    },
    _commandClient: commandClient,
  }
}

describe('createCommandChannelStore', () => {
  it('initializes with empty messages and disconnected', () => {
    const mockClient = makeMockZoomClient()
    const store = createCommandChannelStore(mockClient as any)
    const state = store.getState()

    expect(state.messages).toEqual([])
    expect(state.isConnected).toBe(false)
  })

  it('adds messages on command-channel-message event', () => {
    const mockClient = makeMockZoomClient()
    const store = createCommandChannelStore(mockClient as any)

    const message = {
      senderId: 'user-1',
      senderName: 'Test User',
      text: 'Hello command',
      timestamp: Date.now(),
      msgid: 'msg-1',
    }

    mockClient._emit('command-channel-message', message)

    expect(store.getState().messages).toHaveLength(1)
    expect(store.getState().messages[0]).toEqual(message)
  })

  it('updates isConnected on status event', () => {
    const mockClient = makeMockZoomClient()
    const store = createCommandChannelStore(mockClient as any)

    mockClient._emit('command-channel-status', { status: 'connected' })
    expect(store.getState().isConnected).toBe(true)

    mockClient._emit('command-channel-status', { status: 'disconnected' })
    expect(store.getState().isConnected).toBe(false)
  })

  it('sendMessage calls commandClient.send', async () => {
    const mockClient = makeMockZoomClient()
    const store = createCommandChannelStore(mockClient as any)

    await store.getState().actions.sendMessage('test text', 42)

    expect(mockClient._commandClient.send).toHaveBeenCalledWith('test text', 42)
  })

  it('sendMessage without userId still works', async () => {
    const mockClient = makeMockZoomClient()
    const store = createCommandChannelStore(mockClient as any)

    await store.getState().actions.sendMessage('broadcast msg')

    expect(mockClient._commandClient.send).toHaveBeenCalledWith('broadcast msg', undefined)
  })

  it('cleanup removes event listeners', () => {
    const mockClient = makeMockZoomClient()
    const store = createCommandChannelStore(mockClient as any)

    store.getState().actions.cleanup()

    expect(mockClient.off).toHaveBeenCalledWith('command-channel-message', expect.any(Function))
    expect(mockClient.off).toHaveBeenCalledWith('command-channel-status', expect.any(Function))
  })
})
