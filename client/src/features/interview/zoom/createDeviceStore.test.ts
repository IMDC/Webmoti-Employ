import ZoomVideo from '@zoom/videosdk'
import { appStore } from '@/useAppStore'
import { createDeviceStore, ensureDefaultDevice, resolveDefaultLabels, resolveDeviceId } from './createDeviceStore'

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
  localStorage.clear()
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
    // synthetic 'default' is injected since no real 'default' device exists
    expect(state.audioInputDevices).toHaveLength(2)
    expect(state.audioOutputDevices).toHaveLength(2)
    expect(state.selectedVideoDevice).toBe('cam-1')
    expect(state.selectedAudioInputDevice).toBe('default')
    expect(state.selectedAudioOutputDevice).toBe('default')
  })

  it('filters out dummy/invalid devices but keeps default', async () => {
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
    // 'default' is kept so the app follows the system default; 'communications' is filtered
    expect(state.audioInputDevices).toHaveLength(2)
    expect(state.audioInputDevices[0].deviceId).toBe('default')
    expect(state.audioInputDevices[1].deviceId).toBe('real-mic')
    // prefers 'default' device for audio selection
    expect(state.selectedAudioInputDevice).toBe('default')
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

  it('injects synthetic default and selects it when no default entry exists', async () => {
    vi.mocked(ZoomVideo.getDevices).mockResolvedValue([
      device({ deviceId: 'mic-1', label: 'Microphone 1', kind: 'audioinput' }),
      device({ deviceId: 'mic-2', label: 'Microphone 2', kind: 'audioinput' }),
      device({ deviceId: 'spk-1', label: 'Speaker 1', kind: 'audiooutput' }),
      device({ deviceId: 'cam-1', label: 'Camera', kind: 'videoinput' }),
    ])

    const store = createDeviceStore()
    await store.getState().actions.initDevices()

    const state = store.getState()
    // synthetic 'default' entry is injected on non-Chromium browsers
    expect(state.audioInputDevices[0]).toEqual({ deviceId: 'default', label: 'System default' })
    expect(state.audioOutputDevices[0]).toEqual({ deviceId: 'default', label: 'System default' })
    expect(state.selectedAudioInputDevice).toBe('default')
    expect(state.selectedAudioOutputDevice).toBe('default')
  })

  it('cleanup resets permission state to idle', () => {
    appStore.getState().actions.setPermissionState('granted')

    const store = createDeviceStore()
    store.getState().actions.cleanup()

    expect(appStore.getState().permissionState).toBe('idle')
  })

  it('restores saved device preferences from localStorage', async () => {
    localStorage.setItem('webmoti-device-preferences', JSON.stringify({
      videoDevice: 'cam-2',
      audioInput: 'mic-2',
      audioOutput: 'spk-2',
    }))

    vi.mocked(ZoomVideo.getDevices).mockResolvedValue([
      device({ deviceId: 'cam-1', label: 'Camera 1', kind: 'videoinput' }),
      device({ deviceId: 'cam-2', label: 'Camera 2', kind: 'videoinput' }),
      device({ deviceId: 'mic-1', label: 'Mic 1', kind: 'audioinput' }),
      device({ deviceId: 'mic-2', label: 'Mic 2', kind: 'audioinput' }),
      device({ deviceId: 'spk-1', label: 'Speaker 1', kind: 'audiooutput' }),
      device({ deviceId: 'spk-2', label: 'Speaker 2', kind: 'audiooutput' }),
    ])

    const store = createDeviceStore()
    await store.getState().actions.initDevices()

    const state = store.getState()
    expect(state.selectedVideoDevice).toBe('cam-2')
    expect(state.selectedAudioInputDevice).toBe('mic-2')
    expect(state.selectedAudioOutputDevice).toBe('spk-2')
  })

  it('falls back to defaults when saved device no longer exists', async () => {
    localStorage.setItem('webmoti-device-preferences', JSON.stringify({
      videoDevice: 'cam-gone',
      audioInput: 'mic-gone',
      audioOutput: 'spk-gone',
    }))

    vi.mocked(ZoomVideo.getDevices).mockResolvedValue([
      device({ deviceId: 'cam-1', label: 'Camera 1', kind: 'videoinput' }),
      device({ deviceId: 'mic-1', label: 'Mic 1', kind: 'audioinput' }),
      device({ deviceId: 'spk-1', label: 'Speaker 1', kind: 'audiooutput' }),
    ])

    const store = createDeviceStore()
    await store.getState().actions.initDevices()

    const state = store.getState()
    expect(state.selectedVideoDevice).toBe('cam-1')
    // synthetic 'default' is injected and preferred
    expect(state.selectedAudioInputDevice).toBe('default')
    expect(state.selectedAudioOutputDevice).toBe('default')
  })

  it('persists device selections to localStorage on change', async () => {
    vi.mocked(ZoomVideo.getDevices).mockResolvedValue([
      device({ deviceId: 'cam-1', label: 'Camera 1', kind: 'videoinput' }),
      device({ deviceId: 'mic-1', label: 'Mic 1', kind: 'audioinput' }),
      device({ deviceId: 'spk-1', label: 'Speaker 1', kind: 'audiooutput' }),
    ])

    const store = createDeviceStore()
    await store.getState().actions.initDevices()

    store.setState({ selectedAudioInputDevice: 'mic-1' })

    const saved = JSON.parse(localStorage.getItem('webmoti-device-preferences')!)
    expect(saved.audioInput).toBe('mic-1')
  })
})

describe('ensureDefaultDevice', () => {
  it('returns empty array unchanged', () => {
    expect(ensureDefaultDevice([])).toEqual([])
  })

  it('does not inject when a default device already exists', () => {
    const devices = [
      { deviceId: 'default', label: 'Default - Mic' },
      { deviceId: 'mic-1', label: 'Mic' },
    ]
    expect(ensureDefaultDevice(devices as any)).toBe(devices)
  })

  it('injects System default when no default exists', () => {
    const devices = [
      { deviceId: 'mic-1', label: 'Mic 1' },
      { deviceId: 'mic-2', label: 'Mic 2' },
    ]
    const result = ensureDefaultDevice(devices as any)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ deviceId: 'default', label: 'System default' })
  })
})

describe('resolveDeviceId', () => {
  it('returns non-default device ids as-is', () => {
    expect(resolveDeviceId('mic-1', [])).toBe('mic-1')
  })

  it('resolves Chromium default via label matching', () => {
    const devices = [
      { deviceId: 'default', label: 'Default - Realtek Audio' },
      { deviceId: 'real-1', label: 'Realtek Audio' },
    ]
    expect(resolveDeviceId('default', devices as any)).toBe('real-1')
  })

  it('resolves synthetic System default to first real device', () => {
    const devices = [
      { deviceId: 'default', label: 'System default' },
      { deviceId: 'mic-1', label: 'Microphone 1' },
      { deviceId: 'mic-2', label: 'Microphone 2' },
    ]
    expect(resolveDeviceId('default', devices as any)).toBe('mic-1')
  })

  it('falls back to first real device when label matching fails', () => {
    const devices = [
      { deviceId: 'default', label: 'Unknown Label' },
      { deviceId: 'mic-1', label: 'Microphone 1' },
      { deviceId: 'mic-2', label: 'Microphone 2' },
    ]
    expect(resolveDeviceId('default', devices as any)).toBe('mic-1')
  })
})

describe('resolveDefaultLabels', () => {
  const mockGetUserMedia = vi.fn()
  const mockEnumerateDevices = vi.fn()

  beforeEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
        enumerateDevices: mockEnumerateDevices,
      },
      configurable: true,
    })
  })

  it('skips when no synthetic defaults exist', async () => {
    const inputs = [{ deviceId: 'default', label: 'Default - Mic' }] as any
    const outputs = [{ deviceId: 'default', label: 'Default - Speaker' }] as any
    await resolveDefaultLabels(inputs, outputs)
    expect(mockGetUserMedia).not.toHaveBeenCalled()
  })

  it('labels input default via getUserMedia detection', async () => {
    const mockTrack = { getSettings: () => ({ deviceId: 'mic-1' }), stop: vi.fn() }
    mockGetUserMedia.mockResolvedValue({ getAudioTracks: () => [mockTrack] })

    const inputs = [
      { deviceId: 'default', label: 'System default' },
      { deviceId: 'mic-1', label: 'Realtek Microphone' },
    ] as any
    const outputs = [] as any

    await resolveDefaultLabels(inputs, outputs)
    expect(inputs[0].label).toBe('Default - Realtek Microphone')
    expect(mockTrack.stop).toHaveBeenCalled()
  })

  it('labels output default via groupId matching', async () => {
    const mockTrack = { getSettings: () => ({ deviceId: 'mic-1' }), stop: vi.fn() }
    mockGetUserMedia.mockResolvedValue({ getAudioTracks: () => [mockTrack] })
    mockEnumerateDevices.mockResolvedValue([
      { deviceId: 'mic-1', kind: 'audioinput', groupId: 'group-a' },
      { deviceId: 'spk-1', kind: 'audiooutput', groupId: 'group-a' },
    ])

    const inputs = [{ deviceId: 'default', label: 'System default' }, { deviceId: 'mic-1', label: 'Mic' }] as any
    const outputs = [{ deviceId: 'default', label: 'System default' }, { deviceId: 'spk-1', label: 'Speakers' }] as any

    await resolveDefaultLabels(inputs, outputs)
    expect(outputs[0].label).toBe('Default - Speakers')
  })

  it('falls back to first real output when groupId matching fails', async () => {
    const mockTrack = { getSettings: () => ({ deviceId: 'mic-1' }), stop: vi.fn() }
    mockGetUserMedia.mockResolvedValue({ getAudioTracks: () => [mockTrack] })
    mockEnumerateDevices.mockResolvedValue([
      { deviceId: 'mic-1', kind: 'audioinput', groupId: 'group-a' },
      { deviceId: 'spk-1', kind: 'audiooutput', groupId: 'group-b' },
    ])

    const inputs = [{ deviceId: 'default', label: 'System default' }, { deviceId: 'mic-1', label: 'Mic' }] as any
    const outputs = [{ deviceId: 'default', label: 'System default' }, { deviceId: 'spk-1', label: 'Speakers' }] as any

    await resolveDefaultLabels(inputs, outputs)
    expect(outputs[0].label).toBe('Default - Speakers')
  })

  it('leaves labels as System default when getUserMedia fails', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Not allowed'))

    const inputs = [{ deviceId: 'default', label: 'System default' }] as any
    const outputs = [{ deviceId: 'default', label: 'System default' }] as any

    await resolveDefaultLabels(inputs, outputs)
    expect(inputs[0].label).toBe('System default')
    expect(outputs[0].label).toBe('System default')
  })
})
