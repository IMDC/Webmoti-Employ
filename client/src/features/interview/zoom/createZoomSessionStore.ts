import type { Participant, VideoClient, VideoPlayer } from '@zoom/videosdk'
import type { StoreApi } from 'zustand'
import type { DeviceStore } from './createDeviceStore'
import ZoomVideo, { VideoQuality } from '@zoom/videosdk'
import { createStore } from 'zustand'
import { appStore } from '@/useAppStore'
import { logger } from '@/utils/logger'
import { handleAppError, isExecutedFailure } from '@/utils/utils'

export interface ZoomSessionActions {
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

  attachVideoPlayer: (userId: number, element: VideoPlayer) => Promise<VideoPlayer>
  detachVideoPlayer: (userId: number) => Promise<void>

  startAudio: () => Promise<void>
  stopAudio: () => Promise<void>
  muteAudio: () => Promise<void>
  unmuteAudio: () => Promise<void>
  switchMicrophone: (deviceId: string) => Promise<void>

  cleanup: () => Promise<void>
}

export type CallState = 'prejoin' | 'joining' | 'joined' | 'left'

export interface ZoomSessionStore {
  client: typeof VideoClient
  stream: ReturnType<typeof VideoClient['getMediaStream']> | null
  callState: CallState
  participants: Map<number, Participant>
  // only track local user id and not local participant to avoid stale local participant.
  // we can get the local participant by accessing participants[localUserId].
  localUserId: number | null
  isAudioOn: boolean
  isVideoOn: boolean
  actions: ZoomSessionActions
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
      localUserId: null,
      isAudioOn: true,
      isVideoOn: true,

      actions: {
        setIsAudioOn: value => set({ isAudioOn: value }),
        setIsVideoOn: value => set({ isVideoOn: value }),
        toggleIsAudioOn: () => set(state => ({ isAudioOn: !state.isAudioOn })),
        toggleIsVideoOn: () => set(state => ({ isVideoOn: !state.isVideoOn })),
        initClient: async () => {
          logger.log('Initializing zoom client...')

          const checkReqs = ZoomVideo.checkSystemRequirements()
          if (!checkReqs.video || !checkReqs.audio) {
            const { setError } = appStore.getState().actions
            setError({ message: 'Your device is not supported' })
            return
          }

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

            const { isAudioOn, isVideoOn } = get()
            const granted = appStore.getState().permissionState === 'granted'
            if (granted && isVideoOn)
              await stream.startVideo()
            if (granted && isAudioOn)
              await stream.startAudio()

            set({ stream, callState: 'joined', localUserId: client.getCurrentUserInfo().userId })
            updateParticipants()
          }
          catch (error) {
            set({ callState: 'prejoin', stream: null })
            const { setError } = appStore.getState().actions
            handleAppError(error, setError, 'Failed to join Zoom session')
          }
        },
        leave: async () => {
          logger.log('Leaving zoom session...')
          set({ callState: 'left', participants: new Map() })
          await client.leave()
        },
        startVideo: async () => {
          logger.log('Starting video...')
          await stream().startVideo()
          updateParticipants()
        },
        stopVideo: async () => {
          logger.log('Stopping video...')
          await stream().stopVideo()
          updateParticipants()
        },
        switchCamera: async (deviceId) => {
          await stream().switchCamera(deviceId)
          deviceStore.setState({ selectedVideoDevice: deviceId })
        },
        attachVideoPlayer: async (userId: number, element: VideoPlayer) => {
        // need to detach first to ensure it works properly (this matters in strict mode)
          await stream().detachVideo(userId)

          logger.log('Attaching video player...')
          const player = await stream().attachVideo(userId, VideoQuality.Video_720P, element)

          if (isExecutedFailure(player)) {
            throw new Error('Failed to attach video player')
          }

          return player
        },
        detachVideoPlayer: async (userId: number) => {
          logger.log('Detaching video player...')
          try {
            await stream().detachVideo(userId)
          }
          catch {
          // this happens when you leave the room
            logger.log('Could not detach video player')
          }
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
          client.off('user-added', handleUserAdded)
          client.off('user-removed', handleUserRemoved)
          client.off('user-updated', handleUserUpdated)
          client.off('peer-video-state-change', handlePeerVideoStateChange)
          await ZoomVideo.destroyClient()
        },
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
  function handleUserAdded(payload: Participant[]) {
    payload.forEach((user) => {
      logger.log(`${user.userId} joined the session.`)
    })
    updateParticipants()
  }

  function handleUserRemoved(payload: Participant[]) {
    payload.forEach((user) => {
      logger.log(`${user.userId} left the session.`)
    })
    updateParticipants()
  }

  function handleUserUpdated(payload: Participant[]) {
    payload.forEach((user) => {
      logger.log(`${user.userId} was updated.`)
    })
    updateParticipants()
  }

  client.on('user-added', handleUserAdded)
  client.on('user-removed', handleUserRemoved)
  client.on('user-updated', handleUserUpdated)

  function handlePeerVideoStateChange({ userId, action }: { userId: number, action: string }) {
    logger.log('peer video state change')

    const { stream, actions } = zoomSessionStore.getState()
    if (!stream)
      return

    const player = document.querySelector(`[data-user-id="${userId}"] video-player`) as VideoPlayer | null
    if (!player)
      return

    try {
      if (action === 'Start') {
        actions.attachVideoPlayer(userId, player)
      }
      else if (action === 'Stop') {
        actions.detachVideoPlayer(userId)
      }
    }
    catch (err) {
      console.error(`Error handling peer-video-state-change for user ${userId}`, err)
    }
  }

  client.on('peer-video-state-change', handlePeerVideoStateChange)

  // TODO
  // client.on('device-change', );
  // client.on('device-permission-change', );
  // client.on('active-media-failed', );
  // client.on('active-media-failed', );
  // client.on('network-quality-change', );
  // others... https://developers.zoom.us/docs/video-sdk/web/handle-events/

  return zoomSessionStore
}
