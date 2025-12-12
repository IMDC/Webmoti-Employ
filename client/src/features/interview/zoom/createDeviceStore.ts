import ZoomVideo from '@zoom/videosdk'
import { createStore } from 'zustand'
import { logger } from '@/utils/logger'
import { appStore } from '../../../useAppStore'

export interface DeviceStoreActions {
  initDevices: () => Promise<PermissionState | 'skipped'>
  cleanup: () => void
}

export interface DeviceStore {
  videoDevices: MediaDeviceInfo[]
  audioInputDevices: MediaDeviceInfo[]
  audioOutputDevices: MediaDeviceInfo[]

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

        const isUsableDevice = (d: MediaDeviceInfo) =>
          !!d.deviceId
          && !!d.label
          // some audio devices are duplicated and have fake device ids.
          // these devices are not able to be switched to, so we exclude them here.
          && d.deviceId !== 'default'
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
          appActions.setError({ message: 'Could not access media devices' })
          appActions.setPermissionState('denied')
          return 'denied'
        }

        set({
          videoDevices,
          audioInputDevices,
          audioOutputDevices,
          selectedVideoDevice: videoDevices[0]?.deviceId ?? null,
          selectedAudioInputDevice: audioInputDevices[0]?.deviceId ?? null,
          selectedAudioOutputDevice: audioOutputDevices[0]?.deviceId ?? null,
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
