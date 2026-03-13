import type { DeviceStore } from './createDeviceStore'
import { createStore } from 'zustand'
import { createZoomSessionStore } from './createZoomSessionStore'

// Mock only the SDK import — we only test state management, not actual Zoom calls
vi.mock('@zoom/videosdk', () => ({
  default: {
    checkSystemRequirements: vi.fn(() => ({ video: true, audio: true })),
    createClient: vi.fn(() => ({
      init: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      off: vi.fn(),
      getCurrentUserInfo: vi.fn(() => ({ userId: 1 })),
      getMediaStream: vi.fn(() => ({})),
      join: vi.fn().mockResolvedValue(undefined),
      leave: vi.fn().mockResolvedValue(undefined),
    })),
    destroyClient: vi.fn().mockResolvedValue(undefined),
    preloadDependentAssets: vi.fn(),
  },
  ActiveMediaFailedCode: {},
  AudioChangeAction: {},
  ConnectionState: { Connected: 'Connected', Closed: 'Closed' },
  LeaveAudioSource: {},
  MutedSource: {},
  VideoActiveState: {},
  VideoQuality: { Video_720P: 2 },
}))

vi.mock('@/utils/utils', () => ({
  isExecutedFailure: vi.fn(() => false),
  notifyError: vi.fn(),
  notifyWarning: vi.fn(),
}))

function makeDeviceStore() {
  return createStore<DeviceStore>()(() => ({
    videoDevices: [],
    audioInputDevices: [],
    audioOutputDevices: [],
    selectedVideoDevice: 'cam-1',
    selectedAudioInputDevice: 'mic-1',
    selectedAudioOutputDevice: 'spk-1',
    actions: { initDevices: vi.fn(), cleanup: vi.fn() },
  }))
}

describe('createZoomSessionStore', () => {
  it('initializes with correct default state', () => {
    const store = createZoomSessionStore(makeDeviceStore())
    const state = store.getState()

    expect(state.client).toBeNull()
    expect(state.isInitializing).toBe(false)
    expect(state.stream).toBeNull()
    expect(state.callState).toBe('prejoin')
    expect(state.participants.size).toBe(0)
    expect(state.localUserId).toBeNull()
    expect(state.activeSpeakerUserId).toBeNull()
    expect(state.isAudioOn).toBe(true)
    expect(state.isVideoOn).toBe(true)
    expect(state.isVideoBlurred).toBe(false)
    expect(state.roomName).toBeNull()
  })

  it('setIsAudioOn updates audio state', () => {
    const store = createZoomSessionStore(makeDeviceStore())

    store.getState().actions.setIsAudioOn(false)
    expect(store.getState().isAudioOn).toBe(false)

    store.getState().actions.setIsAudioOn(true)
    expect(store.getState().isAudioOn).toBe(true)
  })

  it('setIsVideoOn updates video state', () => {
    const store = createZoomSessionStore(makeDeviceStore())

    store.getState().actions.setIsVideoOn(false)
    expect(store.getState().isVideoOn).toBe(false)
  })

  it('toggleIsAudioOn flips audio state', () => {
    const store = createZoomSessionStore(makeDeviceStore())

    expect(store.getState().isAudioOn).toBe(true)
    store.getState().actions.toggleIsAudioOn()
    expect(store.getState().isAudioOn).toBe(false)
    store.getState().actions.toggleIsAudioOn()
    expect(store.getState().isAudioOn).toBe(true)
  })

  it('toggleIsVideoOn flips video state', () => {
    const store = createZoomSessionStore(makeDeviceStore())

    expect(store.getState().isVideoOn).toBe(true)
    store.getState().actions.toggleIsVideoOn()
    expect(store.getState().isVideoOn).toBe(false)
  })

  it('toggleBlurPrejoin flips blur state', () => {
    const store = createZoomSessionStore(makeDeviceStore())

    expect(store.getState().isVideoBlurred).toBe(false)
    store.getState().actions.toggleBlurPrejoin()
    expect(store.getState().isVideoBlurred).toBe(true)
    store.getState().actions.toggleBlurPrejoin()
    expect(store.getState().isVideoBlurred).toBe(false)
  })
})
