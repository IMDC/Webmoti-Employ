import type { LocalAudioTrack, LocalVideoTrack, VideoPlayer } from '@zoom/videosdk'
import type { StoreApi } from 'zustand'
import type { ZoomSessionStore } from '../zoom/createZoomSessionStore'
import type { DeviceStore } from '@/features/interview/zoom/createDeviceStore'
import ZoomVideo from '@zoom/videosdk'
import { createStore } from 'zustand'
import { logger } from '@/utils/logger'
import { notifyError } from '@/utils/utils'

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
  switchSpeaker: (speakerId: string) => Promise<void>
  toggleBlurBackground: () => Promise<void>

  cleanup: () => Promise<void>
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
          // "no elements in sequence" happens when leaving the room while camera is starting
          if (error instanceof Error && error.message.includes('no elements in sequence')) {
            logger.log('Camera start aborted (element removed during transition)')
            return
          }
          notifyError('Failed to start camera', error)
          zoomSessionStore.getState().actions.setIsVideoOn(false)
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
        const oldDeviceId = deviceStore.getState().selectedVideoDevice
        const localVideoTrack = get().localVideoTrack
        try {
          deviceStore.setState({ selectedVideoDevice: deviceId })
          await localVideoTrack?.switchCamera(deviceId)
        }
        catch (error) {
          deviceStore.setState({ selectedVideoDevice: oldDeviceId })
          notifyError('Failed to switch camera', error)
          // the failed switch may have left the track in a broken state; stop it cleanly
          try {
            await get().actions.stopCamera()
          }
          catch {}
          zoomSessionStore.getState().actions.setIsVideoOn(false)
        }
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
        const oldDeviceId = deviceStore.getState().selectedAudioInputDevice
        const oldTrack = get().localAudioTrack
        if (!oldTrack)
          return

        await oldTrack.stop()

        let newTrack
        try {
          newTrack = ZoomVideo.createLocalAudioTrack(microphoneId)

          deviceStore.setState({ selectedAudioInputDevice: microphoneId })
          await newTrack.start()
          await newTrack.unmute()
          set({ localAudioTrack: newTrack })
        }
        catch (error) {
          // cleanup new track if it failed
          if (newTrack)
            await newTrack.stop()
          deviceStore.setState({ selectedAudioInputDevice: oldDeviceId })
          await oldTrack.start()
          await oldTrack.unmute()
          notifyError('Failed to switch microphone', error)
        }
      },

      switchSpeaker: async (speakerId) => {
        // this method doesn't actually change speakers because there's no point in doing that in prejoin.
        // it just saves the selection.
        deviceStore.setState({ selectedAudioOutputDevice: speakerId })
      },

      toggleBlurBackground: async () => {
        const localVideoTrack = get().localVideoTrack
        const isVideoBlurred = zoomSessionStore.getState().isVideoBlurred

        if (localVideoTrack) {
          try {
            if (isVideoBlurred) {
              await localVideoTrack.updateVirtualBackground(undefined)
            }
            else {
              await localVideoTrack.updateVirtualBackground('blur')
            }
            zoomSessionStore.getState().actions.toggleBlurPrejoin()
          }
          catch (error) {
            notifyError('Failed to toggle video blur', error)
          }
        }
      },

      cleanup: async () => {
        await get().actions.stopCamera()

        // stop microphone but ignore AudioNotStartedError due to react strict mode
        try {
          await get().actions.stopMicrophone()
        }
        catch (error: unknown) {
          // AudioNotStartedError happens every time so it's safe to ignore
          if (error instanceof Error && error.message === 'AudioNotStartedError') {
            set({ localAudioTrack: null })
            return
          }
          throw error
        }
      },
    },
  }))
}
