import type {
  event_device_permission_change,
  event_network_quality_change,
  event_peer_video_state_change,
  event_video_active_change,
  MediaDevice,
  Participant,
  VideoClient,
  VideoPlayer,
} from '@zoom/videosdk'
import type { StoreApi } from 'zustand'
import type { DeviceStore } from './createDeviceStore'
import ZoomVideo, { VideoActiveState, VideoQuality } from '@zoom/videosdk'
import { createStore } from 'zustand'
import { appStore } from '@/useAppStore'
import { logger } from '@/utils/logger'
import { handleAppError, handleAppErrorWithNotification, isExecutedFailure } from '@/utils/utils'

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
  blurVideo: (isBlurred: boolean) => Promise<void>
  toggleBlurPrejoin: () => void
  switchCamera: (deviceId: string) => Promise<void>

  attachVideoPlayer: (userId: number, element: VideoPlayer) => Promise<VideoPlayer>
  detachVideoPlayer: (userId: number) => Promise<void>

  startAudio: () => Promise<void>
  stopAudio: () => Promise<void>
  muteAudio: () => Promise<void>
  unmuteAudio: () => Promise<void>
  switchMicrophone: (deviceId: string) => Promise<void>
  switchSpeaker: (deviceId: string) => Promise<void>

  cleanup: () => Promise<void>
}

export type CallState = 'prejoin' | 'joining' | 'joined' | 'left'

export interface ZoomSessionStore {
  client: typeof VideoClient | null
  isInitializing: boolean
  stream: ReturnType<typeof VideoClient.getMediaStream> | null
  callState: CallState
  participants: Map<number, Participant>
  networkLevels: Map<number, number>
  // only track local user id and not local participant to avoid stale local participant.
  // we can get the local participant by accessing participants[localUserId].
  localUserId: number | null
  activeSpeakerUserId: number | null
  roomName: string | null
  isAudioOn: boolean
  isVideoOn: boolean
  isVideoBlurred: boolean
  actions: ZoomSessionActions
}

export function createZoomSessionStore(deviceStore: StoreApi<DeviceStore>) {
  const zoomSessionStore = createStore<ZoomSessionStore>((set, get) => {
    const stream = () => {
      const s = get().stream
      if (!s) {
        throw new Error('Stream is null (not initialized)')
      }
      return s
    }

    const client = () => {
      const c = get().client
      if (!c) {
        throw new Error('Client not initialized')
      }
      return c
    }

    async function createClientAndAttachListeners() {
      set({ isInitializing: true })
      const newClient = ZoomVideo.createClient()
      set({ client: newClient })

      await newClient.init('en-US', 'Global', {
        patchJsMedia: true,
        leaveOnPageUnload: true,
      })

      set({ isInitializing: false })

      newClient.on('user-added', handleUserAdded)
      newClient.on('user-removed', handleUserRemoved)
      newClient.on('user-updated', handleUserUpdated)
      newClient.on('peer-video-state-change', handlePeerVideoStateChange)
      newClient.on('device-change', handleDeviceChange)
      newClient.on('device-permission-change', handlePermissionChange)
      newClient.on('video-active-change', handleActiveSpeakerChange)
      newClient.on('network-quality-change', handleNetworkQualityChange)

      // TODO
      // client.on('active-media-failed', );
      // client.on('current-audio-change', );
      // client.on('auto-play-audio-failed', );
      // client.on('video-aspect-ratio-change', );
      // others... https://developers.zoom.us/docs/video-sdk/web/handle-events/

      return newClient
    }

    return {
      client: null,
      isInitializing: false,
      stream: null,
      callState: 'prejoin',
      participants: new Map(),
      networkLevels: new Map(),
      localUserId: null,
      activeSpeakerUserId: null,
      isAudioOn: true,
      isVideoOn: true,
      isVideoBlurred: false,
      roomName: null,

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

          await createClientAndAttachListeners()

          ZoomVideo.preloadDependentAssets()
        },
        join: async (name, roomName, token) => {
          set({ callState: 'joining', roomName })
          logger.log('Joining zoom session...')

          try {
            // create client again here because of an issue with vite refresh causing invalid client state
            await createClientAndAttachListeners()

            await client().join(roomName, token, name)
            const stream = client().getMediaStream()

            // use selected devices from prejoin
            const {
              selectedVideoDevice,
              selectedAudioInputDevice,
              selectedAudioOutputDevice,
            } = deviceStore.getState()

            const { isAudioOn, isVideoOn, isVideoBlurred } = get()
            const granted = appStore.getState().permissionState === 'granted'
            if (granted && isVideoOn) {
              await stream.startVideo({
                cameraId: selectedVideoDevice ?? undefined,
                virtualBackground: {
                  imageUrl: isVideoBlurred ? 'blur' : undefined,
                },
              })
            }
            if (granted && isAudioOn) {
              await stream.startAudio({
                microphoneId: selectedAudioInputDevice ?? undefined,
                speakerId: selectedAudioOutputDevice ?? undefined,
              })
            }

            set({ stream, callState: 'joined', localUserId: client().getCurrentUserInfo().userId })
            updateParticipants()

            if (granted && isVideoOn) {
              try {
                await stream.startVideo({ cameraId: selectedVideoDevice ?? undefined })
                // Force immediate update
                updateParticipants()
                // Wait longer for Zoom to stabilize, then update again
                setTimeout(() => {
                  updateParticipants()
                  const localId = get().localUserId
                  if (localId) {
                    const localParticipant = get().participants.get(localId)
                    logger.log('After startVideo - bVideoOn:', localParticipant?.bVideoOn)
                  }
                }, 500)
              }
              catch {
                set({ isVideoOn: false })
              }
            }

            if (granted && isAudioOn) {
              try {
                await stream.startAudio({
                  microphoneId: selectedAudioInputDevice ?? undefined,
                  speakerId: selectedAudioOutputDevice ?? undefined,
                })
              }
              catch (error) {
                logger.error('Failed to start audio:', error)
                set({ isAudioOn: false })
              }
            }
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
          await client().leave()
        },
        startVideo: async () => {
          logger.log('Starting video...')
          await stream().startVideo()
          updateParticipants()

          // Debug: Check if bVideoOn is updated after starting video
          setTimeout(() => {
            const localId = get().localUserId
            if (localId) {
              const localParticipant = get().participants.get(localId)
              logger.log('After startVideo - local participant:', {
                userId: localId,
                bVideoOn: localParticipant?.bVideoOn,
                isVideoOn: get().isVideoOn,
              })
            }
          }, 500)
        },
        stopVideo: async () => {
          logger.log('Stopping video...')
          await stream().stopVideo()
          updateParticipants()
        },
        blurVideo: async (isBlurred) => {
          const { selectedVideoDevice } = deviceStore.getState()

          try {
            await stream().stopVideo()
            await stream().startVideo(
              {
                cameraId: selectedVideoDevice ?? undefined,
                virtualBackground: {
                  imageUrl: isBlurred ? 'blur' : undefined,
                },
              },
            )
            set({ isVideoBlurred: isBlurred })
          }
          catch (error) {
            handleAppErrorWithNotification(error, 'Failed to set blur')
          }
          updateParticipants()
        },
        toggleBlurPrejoin: () => {
          set(s => ({ isVideoBlurred: !s.isVideoBlurred }))
        },
        switchCamera: async (deviceId) => {
          const oldDeviceId = deviceStore.getState().selectedVideoDevice
          try {
            // setting the state before the async function call makes it appear instant.
            // it also prevents a weird bug where the state flips back right after changing.
            deviceStore.setState({ selectedVideoDevice: deviceId })
            await stream().switchCamera(deviceId)
          }
          catch (error) {
            deviceStore.setState({ selectedVideoDevice: oldDeviceId })
            const { setError } = appStore.getState().actions
            handleAppError(error, setError, 'Failed to switch camera')
          }
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
          const oldDeviceId = deviceStore.getState().selectedAudioInputDevice
          try {
            deviceStore.setState({ selectedAudioInputDevice: deviceId })
            await stream().switchMicrophone(deviceId)
          }
          catch (error) {
            deviceStore.setState({ selectedAudioInputDevice: oldDeviceId })
            const { setError } = appStore.getState().actions
            handleAppError(error, setError, 'Failed to switch microphone')
          }
        },
        switchSpeaker: async (deviceId) => {
          const oldDeviceId = deviceStore.getState().selectedAudioOutputDevice
          try {
            deviceStore.setState({ selectedAudioOutputDevice: deviceId })
            await stream().switchSpeaker(deviceId)
          }
          catch (error) {
            deviceStore.setState({ selectedAudioOutputDevice: oldDeviceId })
            const { setError } = appStore.getState().actions
            handleAppError(error, setError, 'Failed to switch speaker')
          }
        },
        cleanup: async () => {
          logger.log('Cleaning up zoom client...')
          client().off('user-added', handleUserAdded)
          client().off('user-removed', handleUserRemoved)
          client().off('user-updated', handleUserUpdated)
          client().off('peer-video-state-change', handlePeerVideoStateChange)
          client().off('device-change', handleDeviceChange)
          client().off('device-permission-change', handlePermissionChange)
          client().off('video-active-change', handleActiveSpeakerChange)
          client().off('network-quality-change', handleNetworkQualityChange)

          await ZoomVideo.destroyClient()
          set({
            client: null,
            stream: null,
            participants: new Map(),
            localUserId: null,
            callState: 'prejoin',
            networkLevels: new Map(),
            activeSpeakerUserId: null,
          })
        },
      },
    }
  })

  // --------------------------------------------------
  // All zoom event listeners to keep state updated:
  // --------------------------------------------------

  function updateParticipants() {
    const client = zoomSessionStore.getState().client
    if (!client) {
      logger.warn('Could not update participants, client is not initialized')
      return
    }

    const currentParticipants = zoomSessionStore.getState().participants
    const allUsers = client.getAllUser()

    const newParticipants = new Map(
      allUsers.map((user) => {
        const existingUser = currentParticipants.get(user.userId)
        // Preserve bVideoOn if the new value is undefined but we had a previous value
        if (existingUser && user.bVideoOn === undefined && existingUser.bVideoOn !== undefined) {
          logger.log(`Preserving bVideoOn for user ${user.userId}: ${existingUser.bVideoOn}`)
          return [user.userId, { ...user, bVideoOn: existingUser.bVideoOn }]
        }
        return [user.userId, user]
      }),
    )

    zoomSessionStore.setState({
      participants: newParticipants,
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

  async function handleDeviceChange() {
    // device was maybe unplugged/plugged in
    const { stream } = zoomSessionStore.getState()
    if (!stream)
      return

    const filterRealDevices = (devices: MediaDevice[]) =>
      devices.filter(
        d => d.deviceId !== 'default' && d.deviceId !== 'communications',
      )

    // update state with new data
    const cameras = filterRealDevices(stream.getCameraList())
    const microphones = filterRealDevices(stream.getMicList())
    const audioSpeakers = filterRealDevices(stream.getSpeakerList())

    const activeCamera = stream.getActiveCamera()
    const activeMic = stream.getActiveMicrophone()
    const activeSpeaker = stream.getActiveSpeaker()

    deviceStore.setState({
      videoDevices: cameras,
      audioInputDevices: microphones,
      audioOutputDevices: audioSpeakers,
      selectedVideoDevice: activeCamera,
      selectedAudioInputDevice: activeMic,
      selectedAudioOutputDevice: activeSpeaker,
    })
  }

  function handleNetworkQualityChange(payload: Parameters<typeof event_network_quality_change>[0]) {
    const { userId, level, type } = payload

    // uplink is for outgoing
    if (type === 'uplink') {
      zoomSessionStore.setState((state) => {
        const newMap = new Map(state.networkLevels)
        newMap.set(userId, level)
        return { networkLevels: newMap }
      })
    }
  }

  async function handleActiveSpeakerChange(payload: Parameters<typeof event_video_active_change>[0]) {
    const { state, userId } = payload

    if (state === VideoActiveState.Active) {
      zoomSessionStore.setState({ activeSpeakerUserId: userId })
    }
    else if (state === VideoActiveState.Inactive) {
      zoomSessionStore.setState({ activeSpeakerUserId: null })
    }
  }

  function handlePermissionChange(payload: Parameters<typeof event_device_permission_change>[0]) {
    /**
     * name contains 'microphone' or 'camera'
     * state contains 'denied', 'granted' or 'prompt'
     */
    const { name, state } = payload

    const setPermissionState = appStore.getState().actions.setPermissionState
    if (state === 'denied') {
      setPermissionState('denied')
      if (name === 'camera') {
        zoomSessionStore.setState({ isVideoOn: false })
      }
      else {
        zoomSessionStore.setState({ isAudioOn: false })
      }
    }
    else if (state === 'granted') {
      setPermissionState('granted')
    }
    else {
      // prompt
      setPermissionState('acquiring')
    }
  }

  function handleUserUpdated(payload: Participant[]) {
    payload.forEach((user) => {
      logger.log(`User ${user.userId} updated: bVideoOn=${user.bVideoOn}`)
    })
    updateParticipants()
  }

  function handlePeerVideoStateChange(payload: Parameters<typeof event_peer_video_state_change>[0]) {
    const { userId, action } = payload
    logger.log(`Video state change for user ${userId}: ${action}`)
    updateParticipants()

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

  return zoomSessionStore
}
