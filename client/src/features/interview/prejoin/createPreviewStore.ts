import type { LocalAudioTrack, LocalVideoTrack, VideoPlayer } from '@zoom/videosdk'
import type { StoreApi } from 'zustand'
import type { ZoomSessionStore } from '../zoom/createZoomSessionStore'
import type { DeviceStore } from '@/features/interview/zoom/createDeviceStore'
import ZoomVideo from '@zoom/videosdk'
import { createStore } from 'zustand'

export interface PreviewStore {
  localVideoTrack: LocalVideoTrack | null
  localAudioTrack: LocalAudioTrack | null

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

export function createPreviewStore(
  deviceStore: StoreApi<DeviceStore>,
  zoomSessionStore: StoreApi<ZoomSessionStore>,
) {
  return createStore<PreviewStore>((set, get) => ({
    localVideoTrack: null,
    localAudioTrack: null,

    startCamera: async (element) => {
      const selectedVideoDevice = deviceStore.getState().selectedVideoDevice
      if (!selectedVideoDevice) {
        throw new Error('No video device found')
      }

      const track = ZoomVideo.createLocalVideoTrack(selectedVideoDevice)
      await track.start(element)
      set({ localVideoTrack: track })
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
        throw new Error('No audio device found')
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
      zoomSessionStore.getState().toggleIsAudioOn()
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
  }))
}
