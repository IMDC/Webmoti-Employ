import type { Participant, VideoClient, VideoPlayer } from '@zoom/videosdk'
import type { StoreApi } from 'zustand'
import type { DeviceStore } from './createDeviceStore'
import ZoomVideo, { VideoQuality } from '@zoom/videosdk'
import { createStore } from 'zustand'
import { useAppStore } from '@/useAppStore'
import { logger } from '@/utils/logger'
import { handleAppError } from '@/utils/utils'

export interface ZoomSessionStore {
  client: typeof VideoClient
  stream: ReturnType<typeof VideoClient.getMediaStream> | null
  callState: 'prejoin' | 'joining' | 'joined' | 'left'
  participants: Map<number, Participant>

  isAudioOn: boolean
  isVideoOn: boolean
  setIsAudioOn: (value: boolean) => void
  setIsVideoOn: (value: boolean) => void
  toggleIsAudioOn: () => void
  toggleIsVideoOn: () => void

  initClient: () => Promise<void>

  join: (name: string, roomName: string, token: string) => Promise<void>
  leave: () => Promise<void>

  startVideo: () => Promise<void>
  stopVideo: () => Promise<void>
  switchCamera: (deviceId: string) => Promise<void>

  attachVideoPlayer: (userId: number, element: VideoPlayer) => Promise<void>
  detachVideoPlayer: (userId: number) => Promise<void>

  startAudio: () => Promise<void>
  stopAudio: () => Promise<void>
  muteAudio: () => Promise<void>
  unmuteAudio: () => Promise<void>
  switchMicrophone: (deviceId: string) => Promise<void>

  cleanup: () => Promise<void>
}

export function createZoomSessionStore(deviceStore: StoreApi<DeviceStore>) {
  const client = ZoomVideo.createClient()

  const zoomSessionStore = createStore<ZoomSessionStore>((set, get) => {
    const stream = () => {
      const s = get().stream
      if (!s) {
        throw new Error('Stream not initialized')
      }
      return s
    }

    return {
      client,
      stream: null,
      callState: 'prejoin',
      participants: new Map(),

      isAudioOn: true,
      isVideoOn: true,
      setIsAudioOn: value => set({ isAudioOn: value }),
      setIsVideoOn: value => set({ isVideoOn: value }),
      toggleIsAudioOn: () => set(state => ({ isAudioOn: !state.isAudioOn })),
      toggleIsVideoOn: () => set(state => ({ isVideoOn: !state.isVideoOn })),

      initClient: async () => {
        logger.log('Initializing zoom client...')

        await client.init('en-US', 'Global', {
          patchJsMedia: true,
          leaveOnPageUnload: true,
        })

        ZoomVideo.preloadDependentAssets()
      },

      join: async (name, roomName, token) => {
        set({ callState: 'joining' })
        logger.log('Joining zoom session...')

        try {
          await client.join(roomName, token, name)

          const stream = client.getMediaStream()
          try {
            if (useAppStore.getState().permissionState === 'granted') {
              await stream.startVideo()
              await stream.startAudio()
            }
          }
          catch (error: unknown) {
            handleAppError(error, useAppStore.getState().setError, 'Failed to start media')
          }

          set({ stream, callState: 'joined' })
          updateParticipants()
        }
        catch (error: unknown) {
          set({ callState: 'prejoin', stream: null })
          handleAppError(error, useAppStore.getState().setError, 'Failed to join Zoom session')
        }
      },
      leave: async () => {
        logger.log('Leaving zoom session...')

        set({
          callState: 'left',
          stream: null,
          participants: new Map(),
        })

        await client.leave()
      },

      startVideo: async () => {
        logger.log('Starting video...')
        await stream().startVideo()
      },

      stopVideo: async () => {
        logger.log('Stopping video...')
        await stream().stopVideo()
      },
      switchCamera: async (deviceId) => {
        await stream().switchCamera(deviceId)
        deviceStore.setState({ selectedVideoDevice: deviceId })
      },

      attachVideoPlayer: async (userId: number, element: VideoPlayer) => {
        // need to detach first to ensure it works properly (this matters in strict mode)
        await stream().detachVideo(userId)

        logger.log('Attaching video player...')
        await stream().attachVideo(userId, VideoQuality.Video_720P, element)
      },

      detachVideoPlayer: async (userId: number) => {
        logger.log('Detaching video player...')
        await stream().detachVideo(userId)
      },

      startAudio: async () => {
        logger.log('Starting audio...')
        await stream().startAudio()
      },
      stopAudio: async () => {
        logger.log('Stopping audio...')
        // this will stop the user from both sharing and hearing audio
        await stream().stopAudio()
      },
      muteAudio: async () => {
        await stream().muteAudio()
      },
      unmuteAudio: async () => {
        await stream().unmuteAudio()
      },
      switchMicrophone: async (deviceId) => {
        stream().switchMicrophone(deviceId)
        deviceStore.setState({ selectedAudioInputDevice: deviceId })
      },

      cleanup: async () => {
        logger.log('Cleaning up zoom client...')
        client.off('user-added', updateParticipants)
        client.off('user-removed', updateParticipants)
        client.off('user-updated', updateParticipants)
        await ZoomVideo.destroyClient()
      },
    }
  })

  // --------------------------------------------------
  // All zoom event listeners to keep state updated:
  // --------------------------------------------------

  function updateParticipants() {
    zoomSessionStore.setState({
      participants: new Map(client.getAllUser().map(user => [user.userId, user])),
    })
  }
  // todo change this to show notification about user join/leave
  client.on('user-added', updateParticipants)
  client.on('user-removed', updateParticipants)
  client.on('user-updated', updateParticipants)

  // TODO
  // client.on('device-change', );
  // client.on('device-permission-change', );
  // client.on('active-media-failed', );
  // client.on('active-media-failed', );
  // others... https://developers.zoom.us/docs/video-sdk/web/handle-events/

  return zoomSessionStore
}
