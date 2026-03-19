import type { MediaDevice } from '@zoom/videosdk'
import ZoomVideo from '@zoom/videosdk'
import { createStore } from 'zustand'
import { logger } from '@/utils/logger'
import { notifyError } from '@/utils/utils'
import { appStore } from '../../../useAppStore'

// Resolves the browser 'default' device id to the real physical device id
// so the Zoom SDK can switch to it.
export function resolveDeviceId(deviceId: string, devices: MediaDevice[]): string {
  if (deviceId !== 'default')
    return deviceId
  const defaultDevice = devices.find(d => d.deviceId === 'default')
  if (!defaultDevice)
    return deviceId
  const cleanLabel = defaultDevice.label.replace(/^Default\s*-\s*/, '')
  const physical = devices.find(d =>
    d.deviceId !== 'default' && d.deviceId !== 'communications' && d.label === cleanLabel,
  )
  return physical?.deviceId ?? deviceId
}

export interface DeviceStoreActions {
  initDevices: () => Promise<PermissionState | 'skipped'>
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
  return createStore<DeviceStore>(set => ({
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

        const audioInputDevices = devices
          .filter(d => d.kind === 'audioinput')
          .filter(isUsableDevice)

        const audioOutputDevices = devices
          .filter(d => d.kind === 'audiooutput')
          .filter(isUsableDevice)

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
          selectedVideoDevice: videoDevices[0]?.deviceId ?? null,
          // prefer the browser 'default' device so the app follows system default
          selectedAudioInputDevice: audioInputDevices.find(d => d.deviceId === 'default')?.deviceId ?? audioInputDevices[0]?.deviceId ?? null,
          selectedAudioOutputDevice: audioOutputDevices.find(d => d.deviceId === 'default')?.deviceId ?? audioOutputDevices[0]?.deviceId ?? null,
        })

        appActions.setPermissionState('granted')
        return 'granted'
      },

      cleanup: () => {
      // setting this makes it so next time the prejoin screen is loaded,
      // it will init devices properly
        appStore.getState().actions.setPermissionState('idle')
      },
    },
  }))
}
