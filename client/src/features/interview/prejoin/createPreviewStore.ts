import type { LocalAudioTrack, LocalVideoTrack, VideoPlayer } from '@zoom/videosdk'
import type { StoreApi } from 'zustand'
import type { ZoomSessionStore } from '../zoom/createZoomSessionStore'
import type { DeviceStore } from '@/features/interview/zoom/createDeviceStore'
import ZoomVideo from '@zoom/videosdk'
import { createStore } from 'zustand'
import { appStore } from '@/useAppStore'
import { logger } from '@/utils/logger'
import { handleAppError } from '@/utils/utils'

export interface PreviewStoreActions {
  startCamera: (element: VideoPlayer) => Promise<void>
  stopCamera: () => Promise<void>
  switchCamera: (cameraId: string) => Promise<void>

  startMicrophone: () => Promise<void>
  stopMicrophone: () => Promise<void>
  unmuteMicrophone: () => Promise<void>
  muteMicrophone: () => Promise<void>
  toggleMuteMicrophone: () => Promise<void>
  switchMicrophone: (microphoneId: string) => Promise<void>
}

export interface PreviewStore {
  localVideoTrack: LocalVideoTrack | null
  localAudioTrack: LocalAudioTrack | null
  actions: PreviewStoreActions
}

export function createPreviewStore(
  deviceStore: StoreApi<DeviceStore>,
  zoomSessionStore: StoreApi<ZoomSessionStore>,
) {
  return createStore<PreviewStore>((set, get) => ({
    localVideoTrack: null,
    localAudioTrack: null,

    actions: {
      startCamera: async (element) => {
        const selectedVideoDevice = deviceStore.getState().selectedVideoDevice
        if (!selectedVideoDevice) {
          logger.log('No video device found')
          return
        }

        try {
          const track = ZoomVideo.createLocalVideoTrack(selectedVideoDevice)
          await track.start(element)
          set({ localVideoTrack: track })
        }
        catch (error) {
          const { setError } = appStore.getState().actions
          handleAppError(error, setError, 'Failed to start camera')
        }
      },

      stopCamera: async () => {
        const localVideoTrack = get().localVideoTrack
        if (localVideoTrack) {
          await localVideoTrack.stop()
          set({ localVideoTrack: null })
        }
      },

      switchCamera: async (deviceId) => {
        const localVideoTrack = get().localVideoTrack
        localVideoTrack?.switchCamera(deviceId)
        deviceStore.setState({ selectedVideoDevice: deviceId })
      },

      startMicrophone: async () => {
        const selectedAudioInputDevice = deviceStore.getState().selectedAudioInputDevice
        if (!selectedAudioInputDevice) {
          logger.log('No audio device found')
          return
        }

        const track = ZoomVideo.createLocalAudioTrack(selectedAudioInputDevice)
        await track.start()
        await track?.unmute()

        set({ localAudioTrack: track })
      },

      stopMicrophone: async () => {
        const localAudioTrack = get().localAudioTrack
        if (localAudioTrack) {
          await localAudioTrack.stop()
          set({ localAudioTrack: null })
        }
      },

      unmuteMicrophone: async () => {
        const localAudioTrack = get().localAudioTrack
        await localAudioTrack?.unmute()
      },

      muteMicrophone: async () => {
        const localAudioTrack = get().localAudioTrack
        await localAudioTrack?.mute()
      },
      toggleMuteMicrophone: async () => {
        const localAudioTrack = get().localAudioTrack
        const isAudioOn = zoomSessionStore.getState().isAudioOn
        if (isAudioOn) {
          await localAudioTrack?.mute()
        }
        else {
          await localAudioTrack?.unmute()
        }
        zoomSessionStore.getState().actions.toggleIsAudioOn()
      },
      switchMicrophone: async (microphoneId) => {
        const localAudioTrack = get().localAudioTrack
        await localAudioTrack?.stop()

        const newLocalAudioTrack = ZoomVideo.createLocalAudioTrack(microphoneId)
        await newLocalAudioTrack.start()
        newLocalAudioTrack.unmute()
        set({ localAudioTrack: newLocalAudioTrack })
        deviceStore.setState({ selectedAudioInputDevice: microphoneId })
      },
    },
  }))
}
