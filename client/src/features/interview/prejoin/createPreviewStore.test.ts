import type { DeviceStore } from '../zoom/createDeviceStore'
import type { ZoomSessionStore } from '../zoom/createZoomSessionStore'
import { createStore } from 'zustand'
import { createPreviewStore } from './createPreviewStore'

vi.mock('@zoom/videosdk', () => {
  const mockVideoTrack = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    switchCamera: vi.fn().mockResolvedValue(undefined),
    updateVirtualBackground: vi.fn().mockResolvedValue(undefined),
  }
  const mockAudioTrack = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    mute: vi.fn().mockResolvedValue(undefined),
    unmute: vi.fn().mockResolvedValue(undefined),
  }
  return {
    default: {
      createLocalVideoTrack: vi.fn(() => mockVideoTrack),
      createLocalAudioTrack: vi.fn(() => mockAudioTrack),
    },
    _mockVideoTrack: mockVideoTrack,
    _mockAudioTrack: mockAudioTrack,
  }
})

vi.mock('@/utils/utils', () => ({
  notifyError: vi.fn(),
}))

function makeDeviceStore(overrides: Partial<DeviceStore> = {}) {
  return createStore<DeviceStore>(() => ({
    videoDevices: [],
    audioInputDevices: [],
    audioOutputDevices: [],
    selectedVideoDevice: 'cam-1',
    selectedAudioInputDevice: 'mic-1',
    selectedAudioOutputDevice: 'spk-1',
    actions: { initDevices: vi.fn(), cleanup: vi.fn() },
    ...overrides,
  }))
}

function makeZoomSessionStore(overrides: Partial<ZoomSessionStore> = {}) {
  return createStore<ZoomSessionStore>(() => ({
    client: null,
    isInitializing: false,
    stream: null,
    callState: 'prejoin',
    participants: new Map(),
    networkLevels: new Map(),
    localUserId: null,
    activeSpeakerUserId: null,
    roomName: null,
    isAudioOn: true,
    isVideoOn: true,
    isVideoBlurred: false,
    audioEncodingStatistic: null,
    audioDecodingStatistic: null,
    videoEncodingStatistic: null,
    videoDecodingStatistic: null,
    systemResourceUsage: null,
    actions: {
      setIsAudioOn: vi.fn(),
      setIsVideoOn: vi.fn(),
      toggleIsAudioOn: vi.fn(),
      toggleIsVideoOn: vi.fn(),
      toggleBlurPrejoin: vi.fn(),
      initClient: vi.fn(),
      join: vi.fn(),
      leave: vi.fn(),
      startVideo: vi.fn(),
      stopVideo: vi.fn(),
      blurVideo: vi.fn(),
      switchCamera: vi.fn(),
      attachVideoPlayer: vi.fn(),
      detachVideoPlayer: vi.fn(),
      startAudio: vi.fn(),
      stopAudio: vi.fn(),
      muteAudio: vi.fn(),
      unmuteAudio: vi.fn(),
      switchMicrophone: vi.fn(),
      switchSpeaker: vi.fn(),
      cleanup: vi.fn(),
    },
    ...overrides,
  }))
}

describe('createPreviewStore', () => {
  it('initializes with null tracks', () => {
    const store = createPreviewStore(makeDeviceStore(), makeZoomSessionStore())
    const state = store.getState()

    expect(state.localVideoTrack).toBeNull()
    expect(state.localAudioTrack).toBeNull()
  })

  it('startCamera does nothing without selected device', async () => {
    const deviceStore = makeDeviceStore({ selectedVideoDevice: null })
    const store = createPreviewStore(deviceStore, makeZoomSessionStore())
    const element = {} as never

    await store.getState().actions.startCamera(element)

    expect(store.getState().localVideoTrack).toBeNull()
  })

  it('startCamera creates and starts a video track', async () => {
    const store = createPreviewStore(makeDeviceStore(), makeZoomSessionStore())
    const element = {} as never

    await store.getState().actions.startCamera(element)

    expect(store.getState().localVideoTrack).not.toBeNull()
  })

  it('switchSpeaker updates device store selection', async () => {
    const deviceStore = makeDeviceStore()
    const store = createPreviewStore(deviceStore, makeZoomSessionStore())

    await store.getState().actions.switchSpeaker('new-speaker')

    expect(deviceStore.getState().selectedAudioOutputDevice).toBe('new-speaker')
  })

  it('toggleBlurBackground toggles blur on video track', async () => {
    const zoomStore = makeZoomSessionStore({ isVideoBlurred: false })
    const store = createPreviewStore(makeDeviceStore(), zoomStore)

    // Start camera first
    await store.getState().actions.startCamera({} as never)
    await store.getState().actions.toggleBlurBackground()

    expect(zoomStore.getState().actions.toggleBlurPrejoin).toHaveBeenCalled()
  })

  it('cleanup stops camera and microphone tracks', async () => {
    const store = createPreviewStore(makeDeviceStore(), makeZoomSessionStore())

    // Start both tracks
    await store.getState().actions.startCamera({} as never)
    await store.getState().actions.startMicrophone()
    expect(store.getState().localVideoTrack).not.toBeNull()
    expect(store.getState().localAudioTrack).not.toBeNull()

    await store.getState().actions.cleanup()

    expect(store.getState().localVideoTrack).toBeNull()
    expect(store.getState().localAudioTrack).toBeNull()
  })
})
