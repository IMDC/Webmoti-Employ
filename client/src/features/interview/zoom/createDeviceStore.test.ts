import ZoomVideo from '@zoom/videosdk'
import { appStore } from '@/useAppStore'
import { createDeviceStore } from './createDeviceStore'

vi.mock('@zoom/videosdk', () => ({
  default: {
    getDevices: vi.fn(),
  },
}))

vi.mock('@/utils/utils', () => ({
  notifyError: vi.fn(),
}))

function device(overrides: { deviceId?: string, label?: string, kind: MediaDeviceKind }) {
  return {
    deviceId: overrides.deviceId ?? 'dev-1',
    label: overrides.label ?? 'Test Device',
    kind: overrides.kind,
    groupId: '',
    toJSON: () => ({}),
  }
}

beforeEach(() => {
  appStore.getState().actions.setPermissionState('idle')
})

describe('createDeviceStore', () => {
  it('initializes with empty devices and null selections', () => {
    const store = createDeviceStore()
    const state = store.getState()

    expect(state.videoDevices).toEqual([])
    expect(state.audioInputDevices).toEqual([])
    expect(state.audioOutputDevices).toEqual([])
    expect(state.selectedVideoDevice).toBeNull()
    expect(state.selectedAudioInputDevice).toBeNull()
    expect(state.selectedAudioOutputDevice).toBeNull()
  })

  it('populates devices and selects first of each type', async () => {
    vi.mocked(ZoomVideo.getDevices).mockResolvedValue([
      device({ deviceId: 'cam-1', label: 'Webcam', kind: 'videoinput' }),
      device({ deviceId: 'cam-2', label: 'Webcam 2', kind: 'videoinput' }),
      device({ deviceId: 'mic-1', label: 'Microphone', kind: 'audioinput' }),
      device({ deviceId: 'spk-1', label: 'Speakers', kind: 'audiooutput' }),
    ])

    const store = createDeviceStore()
    const result = await store.getState().actions.initDevices()

    expect(result).toBe('granted')
    expect(appStore.getState().permissionState).toBe('granted')

    const state = store.getState()
    expect(state.videoDevices).toHaveLength(2)
    expect(state.audioInputDevices).toHaveLength(1)
    expect(state.audioOutputDevices).toHaveLength(1)
    expect(state.selectedVideoDevice).toBe('cam-1')
    expect(state.selectedAudioInputDevice).toBe('mic-1')
    expect(state.selectedAudioOutputDevice).toBe('spk-1')
  })

  it('filters out dummy/invalid devices', async () => {
    vi.mocked(ZoomVideo.getDevices).mockResolvedValue([
      device({ deviceId: '', label: 'No ID', kind: 'videoinput' }),
      device({ deviceId: 'valid', label: '', kind: 'videoinput' }),
      device({ deviceId: 'default', label: 'Default Mic', kind: 'audioinput' }),
      device({ deviceId: 'communications', label: 'Comms Mic', kind: 'audioinput' }),
      device({ deviceId: 'real-cam', label: 'Real Camera', kind: 'videoinput' }),
      device({ deviceId: 'real-mic', label: 'Real Mic', kind: 'audioinput' }),
    ])

    const store = createDeviceStore()
    await store.getState().actions.initDevices()

    const state = store.getState()
    expect(state.videoDevices).toHaveLength(1)
    expect(state.videoDevices[0].deviceId).toBe('real-cam')
    expect(state.audioInputDevices).toHaveLength(1)
    expect(state.audioInputDevices[0].deviceId).toBe('real-mic')
  })

  it('returns denied when no usable devices found', async () => {
    vi.mocked(ZoomVideo.getDevices).mockResolvedValue([
      device({ deviceId: '', label: '', kind: 'videoinput' }),
    ])

    const store = createDeviceStore()
    const result = await store.getState().actions.initDevices()

    expect(result).toBe('denied')
    expect(appStore.getState().permissionState).toBe('denied')
  })

  it('returns skipped when already acquiring', async () => {
    appStore.getState().actions.setPermissionState('acquiring')

    const store = createDeviceStore()
    const result = await store.getState().actions.initDevices()

    expect(result).toBe('skipped')
  })

  it('cleanup resets permission state to idle', () => {
    appStore.getState().actions.setPermissionState('granted')

    const store = createDeviceStore()
    store.getState().actions.cleanup()

    expect(appStore.getState().permissionState).toBe('idle')
  })
})
