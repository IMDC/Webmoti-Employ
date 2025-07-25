import ZoomVideo from '@zoom/videosdk'
import { createStore } from 'zustand'
import { logger } from '@/utils/logger'
import { appStore } from '../../../useAppStore'

export interface DeviceStore {
  videoDevices: MediaDeviceInfo[]
  audioInputDevices: MediaDeviceInfo[]
  audioOutputDevices: MediaDeviceInfo[]

  selectedVideoDevice: string | null
  selectedAudioInputDevice: string | null
  selectedAudioOutputDevice: string | null

  initDevices: () => Promise<PermissionState | 'skipped'>
  cleanup: () => void
}

export function createDeviceStore() {
  return createStore<DeviceStore>(set => ({
    videoDevices: [],
    audioInputDevices: [],
    audioOutputDevices: [],

    selectedVideoDevice: null,
    selectedAudioInputDevice: null,
    selectedAudioOutputDevice: null,

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

      const videoDevices = devices.filter(d => d.kind === 'videoinput')
      const audioInputDevices = devices.filter(d => d.kind === 'audioinput')
      const audioOutputDevices = devices.filter(d => d.kind === 'audiooutput')

      // need to check for dummy devices when permission denied
      const isValidDevice = (d: MediaDeviceInfo) => d.deviceId && d.label
      const hasPermission = [...videoDevices, ...audioInputDevices].some(isValidDevice)

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
  }))
}
