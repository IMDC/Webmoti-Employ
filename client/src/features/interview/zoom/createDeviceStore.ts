import type { MediaDevice } from '@zoom/videosdk'
import ZoomVideo from '@zoom/videosdk'
import { createStore } from 'zustand'
import { logger } from '@/utils/logger'
import { notifyError } from '@/utils/utils'
import { appStore } from '../../../useAppStore'

const DEVICE_PREFS_KEY = 'webmoti-device-preferences'

interface DevicePreferences {
  videoDevice: string | null
  audioInput: string | null
  audioOutput: string | null
}

function loadDevicePreferences(): DevicePreferences | null {
  try {
    const raw = localStorage.getItem(DEVICE_PREFS_KEY)
    return raw ? JSON.parse(raw) : null
  }
  catch {
    return null
  }
}

function saveDevicePreferences(prefs: DevicePreferences): void {
  try {
    localStorage.setItem(DEVICE_PREFS_KEY, JSON.stringify(prefs))
  }
  catch {
    // storage full or unavailable
  }
}

// Non-Chromium browsers (Firefox/Safari) don't expose a virtual "default" device.
// Adds a synthetic "System default" entry so the UI always offers a default option.
export function ensureDefaultDevice(devices: MediaDevice[]): MediaDevice[] {
  if (devices.length === 0 || devices.some(d => d.deviceId === 'default'))
    return devices
  return [{ deviceId: 'default', label: 'System default' }, ...devices]
}

// Updates synthetic "System default" labels to "Default - <device name>"
// by detecting the actual default input device via getUserMedia.
// For output, falls back to the first real device in the list.
export async function resolveDefaultLabels(
  audioInputDevices: MediaDevice[],
  audioOutputDevices: MediaDevice[],
): Promise<void> {
  const syntheticInput = audioInputDevices.find(d => d.deviceId === 'default' && d.label === 'System default')
  const syntheticOutput = audioOutputDevices.find(d => d.deviceId === 'default' && d.label === 'System default')

  if (!syntheticInput && !syntheticOutput)
    return

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const track = stream.getAudioTracks()[0]
    const detectedId = track.getSettings().deviceId
    track.stop()

    if (syntheticInput) {
      const match = audioInputDevices.find(d => d.deviceId !== 'default' && d.deviceId === detectedId)
      if (match)
        syntheticInput.label = `Default - ${match.label}`
    }

    if (syntheticOutput) {
      // detect output via groupId from the detected input device
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const inputInfo = allDevices.find(d => d.deviceId === detectedId)
      if (inputInfo?.groupId) {
        const outputInfo = allDevices.find(d => d.kind === 'audiooutput' && d.groupId === inputInfo.groupId)
        if (outputInfo) {
          const match = audioOutputDevices.find(d => d.deviceId !== 'default' && d.deviceId === outputInfo.deviceId)
          if (match)
            syntheticOutput.label = `Default - ${match.label}`
        }
      }
      // fall back to first real output device if groupId matching failed
      if (syntheticOutput.label === 'System default') {
        const firstReal = audioOutputDevices.find(d => d.deviceId !== 'default' && d.deviceId !== 'communications')
        if (firstReal)
          syntheticOutput.label = `Default - ${firstReal.label}`
      }
    }
  }
  catch {
    // getUserMedia failed; leave labels as "System default"
  }
}

// Resolves the browser 'default' device id to the real physical device id
// so the Zoom SDK can switch to it.
export function resolveDeviceId(deviceId: string, devices: MediaDevice[]): string {
  if (deviceId !== 'default')
    return deviceId
  const defaultDevice = devices.find(d => d.deviceId === 'default')
  if (!defaultDevice)
    return deviceId
  // Chromium labels the default device as "Default - <real device name>"
  const cleanLabel = defaultDevice.label.replace(/^Default\s*-\s*/, '')
  const physical = devices.find(d =>
    d.deviceId !== 'default' && d.deviceId !== 'communications' && d.label === cleanLabel,
  )
  if (physical)
    return physical.deviceId
  // Non-Chromium browsers don't have a "Default - ..." label;
  // fall back to the first real device (typically the system default)
  const firstReal = devices.find(d => d.deviceId !== 'default' && d.deviceId !== 'communications')
  return firstReal?.deviceId ?? deviceId
}

export interface DeviceStoreActions {
  initDevices: () => Promise<PermissionState | 'skipped'>
  refreshDevices: () => Promise<void>
  cleanup: () => void
}

export interface DeviceStore {
  videoDevices: MediaDevice[]
  audioInputDevices: MediaDevice[]
  audioOutputDevices: MediaDevice[]

  selectedVideoDevice: string | null
  selectedAudioInputDevice: string | null
  selectedAudioOutputDevice: string | null

  actions: DeviceStoreActions
}

export function createDeviceStore() {
  const store = createStore<DeviceStore>(set => ({
    videoDevices: [],
    audioInputDevices: [],
    audioOutputDevices: [],

    selectedVideoDevice: null,
    selectedAudioInputDevice: null,
    selectedAudioOutputDevice: null,

    actions: {
      initDevices: async () => {
        const appState = appStore.getState()
        const appActions = appState.actions
        if (appState.permissionState === 'acquiring') {
          logger.log('Already acquiring devices')
          return 'skipped'
        }
        appActions.setPermissionState('acquiring')

        const prefs = loadDevicePreferences()

        // try catch doesn't work on this function
        const devices = await ZoomVideo.getDevices()

        const isUsableDevice = (d: MediaDevice) =>
          // valid devices have a device id and a label.
          // sometimes dummy devices are added without these when permission isn't granted yet.
          !!d.deviceId
          && !!d.label
          // 'communications' devices are duplicates with a fake id that can't be switched to
          && d.deviceId !== 'communications'

        const videoDevices = devices
          .filter(d => d.kind === 'videoinput')
          .filter(isUsableDevice)

        const audioInputDevices = ensureDefaultDevice(
          devices.filter(d => d.kind === 'audioinput').filter(isUsableDevice),
        )

        const audioOutputDevices = ensureDefaultDevice(
          devices.filter(d => d.kind === 'audiooutput').filter(isUsableDevice),
        )

        await resolveDefaultLabels(audioInputDevices, audioOutputDevices)

        // need to check for dummy devices when permission denied
        const hasPermission = [...videoDevices, ...audioInputDevices].length > 0

        if (!hasPermission) {
          notifyError('Could not access media devices')
          appActions.setPermissionState('denied')
          return 'denied'
        }

        set({
          videoDevices,
          audioInputDevices,
          audioOutputDevices,
          selectedVideoDevice:
            (prefs?.videoDevice && videoDevices.some(d => d.deviceId === prefs.videoDevice) ? prefs.videoDevice : null)
            ?? videoDevices[0]?.deviceId ?? null,
          // prefer the saved device, then the browser 'default' device so the app follows system default
          selectedAudioInputDevice:
            (prefs?.audioInput && audioInputDevices.some(d => d.deviceId === prefs.audioInput) ? prefs.audioInput : null)
            ?? audioInputDevices.find(d => d.deviceId === 'default')?.deviceId ?? audioInputDevices[0]?.deviceId ?? null,
          selectedAudioOutputDevice:
            (prefs?.audioOutput && audioOutputDevices.some(d => d.deviceId === prefs.audioOutput) ? prefs.audioOutput : null)
            ?? audioOutputDevices.find(d => d.deviceId === 'default')?.deviceId ?? audioOutputDevices[0]?.deviceId ?? null,
        })

        appActions.setPermissionState('granted')
        return 'granted'
      },

      // re-enumerate devices and update lists (e.g. after a devicechange event)
      refreshDevices: async () => {
        const devices = await ZoomVideo.getDevices()

        const isUsableDevice = (d: MediaDevice) =>
          !!d.deviceId
          && !!d.label
          && d.deviceId !== 'communications'

        const videoDevices = devices
          .filter(d => d.kind === 'videoinput')
          .filter(isUsableDevice)

        const audioInputDevices = ensureDefaultDevice(
          devices.filter(d => d.kind === 'audioinput').filter(isUsableDevice),
        )

        const audioOutputDevices = ensureDefaultDevice(
          devices.filter(d => d.kind === 'audiooutput').filter(isUsableDevice),
        )

        await resolveDefaultLabels(audioInputDevices, audioOutputDevices)

        set({ videoDevices, audioInputDevices, audioOutputDevices })
      },

      cleanup: () => {
      // setting this makes it so next time the prejoin screen is loaded,
      // it will init devices properly
        appStore.getState().actions.setPermissionState('idle')
      },
    },
  }))

  // persist device selections to localStorage whenever they change
  store.subscribe((state, prev) => {
    if (
      state.selectedVideoDevice !== prev.selectedVideoDevice
      || state.selectedAudioInputDevice !== prev.selectedAudioInputDevice
      || state.selectedAudioOutputDevice !== prev.selectedAudioOutputDevice
    ) {
      saveDevicePreferences({
        videoDevice: state.selectedVideoDevice,
        audioInput: state.selectedAudioInputDevice,
        audioOutput: state.selectedAudioOutputDevice,
      })
    }
  })

  return store
}
