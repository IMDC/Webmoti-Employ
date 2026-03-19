import type {
  AudioQosData,
  event_active_media_failed,
  event_audio_statistic_data_change,
  event_connection_change,
  event_current_audio_change,
  event_device_permission_change,
  event_network_quality_change,
  event_peer_video_state_change,
  event_system_resource_usage_change,
  event_video_active_change,
  event_video_aspect_ratio_change,
  event_video_statistic_data_change,
  MediaDevice,
  Participant,
  VideoClient,
  VideoPlayer,
  VideoQosData,
} from '@zoom/videosdk'
import type { StoreApi } from 'zustand'
import type { DeviceStore } from './createDeviceStore'
import { notifications } from '@mantine/notifications'
import ZoomVideo, { ActiveMediaFailedCode, AudioChangeAction, ConnectionState, LeaveAudioSource, MutedSource, VideoActiveState, VideoQuality } from '@zoom/videosdk'
import { createStore } from 'zustand'
import { appStore } from '@/useAppStore'
import { VIDEO_CAPTURE_HEIGHT, VIDEO_CAPTURE_WIDTH } from '@/utils/constants'
import { logger } from '@/utils/logger'
import { isExecutedFailure, notifyError, notifyWarning } from '@/utils/utils'
import { resolveDeviceId } from './createDeviceStore'

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

  attachVideoPlayer: (userId: number, element: VideoPlayer) => Promise<void>
  detachVideoPlayer: (userId: number) => Promise<void>

  startAudio: () => Promise<void>
  stopAudio: () => Promise<void>
  muteAudio: () => Promise<void>
  unmuteAudio: () => Promise<void>
  switchMicrophone: (deviceId: string) => Promise<void>
  switchSpeaker: (deviceId: string) => Promise<void>

  cleanup: () => Promise<void>
}

export type ZoomSystemResourceUsage = Parameters<typeof event_system_resource_usage_change>[0]

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
  audioEncodingStatistic: AudioQosData | null
  audioDecodingStatistic: AudioQosData | null
  videoEncodingStatistic: VideoQosData | null
  videoDecodingStatistic: VideoQosData | null
  systemResourceUsage: ZoomSystemResourceUsage | null
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
        throw new Error('Client not initialized in store')
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
        stayAwake: true,
      })

      // there's some bug with zoom where the client hasn't finished initializing here.
      // it only happens in dev.
      // if you try to join too early here, it will error: "Client not initialized"
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 1350))
      }

      set({ isInitializing: false })

      newClient.on('user-added', handleUserAdded)
      newClient.on('user-removed', handleUserRemoved)
      newClient.on('user-updated', handleUserUpdated)
      newClient.on('peer-video-state-change', handlePeerVideoStateChange)
      newClient.on('device-change', handleDeviceChange)
      newClient.on('device-permission-change', handlePermissionChange)
      newClient.on('video-active-change', handleActiveSpeakerChange)
      newClient.on('network-quality-change', handleNetworkQualityChange)
      newClient.on('connection-change', handleConnectionChange)
      newClient.on('active-media-failed', handleActiveMediaFailed)
      newClient.on('current-audio-change', handleCurrentAudioChange)
      newClient.on('auto-play-audio-failed', handleAutoPlayAudioFailed)
      newClient.on('speaking-while-muted', handleSpeakingWhileMuted)
      newClient.on('video-aspect-ratio-change', handleVideoAspectRatioChange)

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
      audioEncodingStatistic: null,
      audioDecodingStatistic: null,
      videoEncodingStatistic: null,
      videoDecodingStatistic: null,
      systemResourceUsage: null,
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
            notifyError('Your device is not supported')
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
              const videoDevices = deviceStore.getState().videoDevices
              await stream.startVideo({
                cameraId: selectedVideoDevice ? resolveDeviceId(selectedVideoDevice, videoDevices) : undefined,
                captureWidth: VIDEO_CAPTURE_WIDTH,
                captureHeight: VIDEO_CAPTURE_HEIGHT,
                virtualBackground: {
                  imageUrl: isVideoBlurred ? 'blur' : undefined,
                },
              })
            }
            if (granted && isAudioOn) {
              const audioInputDevices = deviceStore.getState().audioInputDevices
              const audioOutputDevices = deviceStore.getState().audioOutputDevices
              await stream.startAudio({
                microphoneId: selectedAudioInputDevice ? resolveDeviceId(selectedAudioInputDevice, audioInputDevices) : undefined,
                speakerId: selectedAudioOutputDevice ? resolveDeviceId(selectedAudioOutputDevice, audioOutputDevices) : undefined,
              })
            }

            set({ stream, callState: 'joined', localUserId: client().getCurrentUserInfo().userId })
            subscribeStatisticsEvents()
            updateParticipants()
          }
          catch (error) {
            set({ callState: 'prejoin', stream: null })
            unsubscribeStatisticsEvents()
            resetStatisticsState()
            notifyError('Failed to join Zoom session', error)
          }
        },
        leave: async () => {
          logger.log('Leaving zoom session...')
          // stopping video also stops audio so the mic indicator goes away in google chrome
          try {
            await get().actions.stopVideo()
          }
          catch {
            // camera may already be closed, safe to ignore
          }
          unsubscribeStatisticsEvents()
          resetStatisticsState()
          set({ callState: 'left', participants: new Map() })
          await client().leave()
        },
        startVideo: async () => {
          logger.log('Starting video...')
          const { selectedVideoDevice, videoDevices } = deviceStore.getState()
          try {
            await stream().startVideo(
              {
                cameraId: selectedVideoDevice ? resolveDeviceId(selectedVideoDevice, videoDevices) : undefined,
                captureWidth: VIDEO_CAPTURE_WIDTH,
                captureHeight: VIDEO_CAPTURE_HEIGHT,
              },
            )
            updateParticipants()
          }
          catch (error) {
            set({ isVideoOn: false })
            notifyError('Failed to start video', error)
          }
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
                captureWidth: VIDEO_CAPTURE_WIDTH,
                captureHeight: VIDEO_CAPTURE_HEIGHT,
                virtualBackground: {
                  imageUrl: isBlurred ? 'blur' : undefined,
                },
              },
            )
            set({ isVideoBlurred: isBlurred })
          }
          catch (error) {
            notifyError('Failed to set blur', error)
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
            const resolved = resolveDeviceId(deviceId, deviceStore.getState().videoDevices)
            await stream().switchCamera(resolved)
          }
          catch (error) {
            deviceStore.setState({ selectedVideoDevice: oldDeviceId })
            notifyError('Failed to switch camera', error)
            // the failed switch may have left the stream stopped; ensure state reflects it
            try {
              await stream().stopVideo()
            }
            catch {}
            set({ isVideoOn: false })
          }
        },
        attachVideoPlayer: async (userId: number, element: VideoPlayer) => {
          logger.log('Attaching video player...')
          const result = await stream().attachVideo(userId, VideoQuality.Video_720P, element)

          if (isExecutedFailure(result)) {
            throw new Error('Failed to attach video player')
          }
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
            const resolved = resolveDeviceId(deviceId, deviceStore.getState().audioInputDevices)
            await stream().switchMicrophone(resolved)
          }
          catch (error) {
            deviceStore.setState({ selectedAudioInputDevice: oldDeviceId })
            notifyError('Failed to switch microphone', error)
          }
        },
        switchSpeaker: async (deviceId) => {
          const oldDeviceId = deviceStore.getState().selectedAudioOutputDevice
          try {
            deviceStore.setState({ selectedAudioOutputDevice: deviceId })
            const resolved = resolveDeviceId(deviceId, deviceStore.getState().audioOutputDevices)
            await stream().switchSpeaker(resolved)
          }
          catch (error) {
            deviceStore.setState({ selectedAudioOutputDevice: oldDeviceId })
            notifyError('Failed to switch speaker', error)
          }
        },
        cleanup: async () => {
          logger.log('Cleaning up zoom client...')
          // Only unsubscribe if leave() hasn't already done it
          if (get().callState === 'joined') {
            unsubscribeStatisticsEvents()
          }
          resetStatisticsState()
          client().off('user-added', handleUserAdded)
          client().off('user-removed', handleUserRemoved)
          client().off('user-updated', handleUserUpdated)
          client().off('peer-video-state-change', handlePeerVideoStateChange)
          client().off('device-change', handleDeviceChange)
          client().off('device-permission-change', handlePermissionChange)
          client().off('video-active-change', handleActiveSpeakerChange)
          client().off('network-quality-change', handleNetworkQualityChange)
          client().off('connection-change', handleConnectionChange)
          client().off('active-media-failed', handleActiveMediaFailed)
          client().off('current-audio-change', handleCurrentAudioChange)
          client().off('auto-play-audio-failed', handleAutoPlayAudioFailed)
          client().off('speaking-while-muted', handleSpeakingWhileMuted)
          client().off('video-aspect-ratio-change', handleVideoAspectRatioChange)

          logger.log('Destroying zoom client')
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

  function resetStatisticsState() {
    zoomSessionStore.setState({
      audioEncodingStatistic: null,
      audioDecodingStatistic: null,
      videoEncodingStatistic: null,
      videoDecodingStatistic: null,
      systemResourceUsage: null,
    })
  }

  function handleAudioStatisticDataChange(payload: Parameters<typeof event_audio_statistic_data_change>[0]) {
    const { encoding, ...stats } = payload.data
    if (encoding) {
      zoomSessionStore.setState({ audioEncodingStatistic: stats })
    }
    else {
      zoomSessionStore.setState({ audioDecodingStatistic: stats })
    }
  }

  function handleVideoStatisticDataChange(payload: Parameters<typeof event_video_statistic_data_change>[0]) {
    const { encoding, ...stats } = payload.data
    if (encoding) {
      zoomSessionStore.setState({ videoEncodingStatistic: stats })
    }
    else {
      zoomSessionStore.setState({ videoDecodingStatistic: stats })
    }
  }

  function handleSystemResourceUsageChange(payload: ZoomSystemResourceUsage) {
    zoomSessionStore.setState({ systemResourceUsage: payload })
  }

  function subscribeStatisticsEvents() {
    const { stream, client, callState } = zoomSessionStore.getState()
    if (!stream || !client || callState !== 'joined')
      return

    stream.subscribeAudioStatisticData()
    stream.subscribeVideoStatisticData()
    void stream.subscribeSystemResourceUsage().catch(error => logger.warn('Failed to subscribe system resource usage', error))

    client.on('audio-statistic-data-change', handleAudioStatisticDataChange)
    client.on('video-statistic-data-change', handleVideoStatisticDataChange)
    client.on('system-resource-usage-change', handleSystemResourceUsageChange)
  }

  function unsubscribeStatisticsEvents() {
    const { stream, client } = zoomSessionStore.getState()

    if (client) {
      client.off('audio-statistic-data-change', handleAudioStatisticDataChange)
      client.off('video-statistic-data-change', handleVideoStatisticDataChange)
      client.off('system-resource-usage-change', handleSystemResourceUsageChange)
    }

    if (stream) {
      stream.unsubscribeAudioStatisticData()
      stream.unsubscribeVideoStatisticData()
      void stream.unsubscribeSystemResourceUsage().catch(error => logger.warn('Failed to unsubscribe system resource usage', error))
    }
  }

  function updateParticipants() {
    const client = zoomSessionStore.getState().client
    if (!client) {
      logger.warn('Could not update participants, client is not initialized')
      return
    }

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

  async function handleDeviceChange() {
    // device was maybe unplugged/plugged in
    const { stream } = zoomSessionStore.getState()
    if (!stream)
      return

    // keep 'default' devices so the app can follow the system default
    const filterFakeDevices = (devices: MediaDevice[]) =>
      devices.filter(d => d.deviceId !== 'communications')

    // update state with new data
    const cameras = filterFakeDevices(stream.getCameraList())
    const microphones = filterFakeDevices(stream.getMicList())
    const audioSpeakers = filterFakeDevices(stream.getSpeakerList())

    const currentState = deviceStore.getState()
    const activeCamera = stream.getActiveCamera()
    const activeMic = stream.getActiveMicrophone()
    const activeSpeaker = stream.getActiveSpeaker()

    // preserve 'default' selection so the app continues to follow the system default;
    // otherwise fall back to the SDK's active device
    const selectedAudioInputDevice = currentState.selectedAudioInputDevice === 'default' && microphones.find(d => d.deviceId === 'default')
      ? 'default'
      : activeMic
    const selectedAudioOutputDevice = currentState.selectedAudioOutputDevice === 'default' && audioSpeakers.find(d => d.deviceId === 'default')
      ? 'default'
      : activeSpeaker

    deviceStore.setState({
      videoDevices: cameras,
      audioInputDevices: microphones,
      audioOutputDevices: audioSpeakers,
      selectedVideoDevice: activeCamera,
      selectedAudioInputDevice,
      selectedAudioOutputDevice,
    })

    // if 'default' was selected, the system default may have changed to a different
    // physical device -- resolve and switch the SDK to the new one
    if (currentState.selectedAudioInputDevice === 'default') {
      const newPhysicalId = resolveDeviceId('default', microphones)
      if (newPhysicalId !== activeMic) {
        try {
          await stream.switchMicrophone(newPhysicalId)
        }
        catch (error) {
          logger.warn('Failed to follow default microphone', error)
        }
      }
    }
    if (currentState.selectedAudioOutputDevice === 'default') {
      const newPhysicalId = resolveDeviceId('default', audioSpeakers)
      if (newPhysicalId !== activeSpeaker) {
        try {
          await stream.switchSpeaker(newPhysicalId)
        }
        catch (error) {
          logger.warn('Failed to follow default speaker', error)
        }
      }
    }
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
      logger.log(`User ${user.userId} was updated`)
      if (user.isInFailover) {
        logger.warn(`User ${user.userId} is in failover (reconnecting)`)
      }
    })
    updateParticipants()
  }

  function handlePeerVideoStateChange(payload: Parameters<typeof event_peer_video_state_change>[0]) {
    const { userId, action } = payload
    logger.log(`Video state change for user ${userId}: ${action}`)

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
      logger.error(`Error handling peer-video-state-change for user ${userId}`, err)
    }
  }

  function handleConnectionChange(payload: Parameters<typeof event_connection_change>[0]) {
    if (payload.state === ConnectionState.Closed) {
      zoomSessionStore.setState({ callState: 'left' })
    }
    else if (payload.state === ConnectionState.Reconnecting) {
      notifications.show({
        id: 'connection-reconnecting',
        title: 'Reconnecting',
        message: 'Connection lost. Attempting to reconnect...',
        color: 'yellow',
        autoClose: false,
      })
    }
    else if (payload.state === ConnectionState.Connected) {
      notifications.hide('connection-reconnecting')
    }
    else if (payload.state === ConnectionState.Fail) {
      notifyError('Connection failed', payload.reason ?? 'Failed to connect to the session.')
      zoomSessionStore.setState({ callState: 'left' })
    }
  }

  function handleActiveMediaFailed(payload: Parameters<typeof event_active_media_failed>[0]) {
    const { code, message } = payload

    if (
      [ActiveMediaFailedCode.CameraPermissionReset, ActiveMediaFailedCode.MicrophonePermissionReset, ActiveMediaFailedCode.MicrophoneMuted].includes(code)
    ) {
      notifyError('Permission issue', message)
    }
    else if (
      [ActiveMediaFailedCode.AudioStreamMuted, ActiveMediaFailedCode.AudioPlaybackInterrupted, ActiveMediaFailedCode.VideoStreamMuted].includes(code)
    ) {
      notifications.show({
        id: 'media-interrupted',
        title: 'Media interrupted',
        message: 'Click anywhere on the page to resume.',
        color: 'yellow',
      })
    }
    else {
      notifyError('Media error', message)
    }
  }

  function handleCurrentAudioChange(payload: Parameters<typeof event_current_audio_change>[0]) {
    const { action, source } = payload

    if (action === AudioChangeAction.Leave) {
      if (source === LeaveAudioSource.EndedBySystem || source === LeaveAudioSource.MicrophoneError) {
        notifyError('Audio ended', 'Audio was stopped due to a system error.')
      }
      else {
        // Audio was disconnected (e.g. phone call or another app took the mic)
        notifyWarning('Audio disconnected', 'Your audio was disconnected. Please re-enable audio to be heard.')
      }
      zoomSessionStore.setState({ isAudioOn: false })
    }
    else if (action === AudioChangeAction.Muted) {
      if (source === MutedSource.PassiveByMuteOne || source === MutedSource.PassiveByMuteAll) {
        notifyWarning('Muted by host', 'The host has muted your audio.')
        zoomSessionStore.setState({ isAudioOn: false })
      }
    }
  }

  function handleAutoPlayAudioFailed() {
    notifications.show({
      id: 'auto-play-failed',
      title: 'Audio playback blocked',
      message: 'Click anywhere on the page to enable audio.',
      color: 'yellow',
      autoClose: false,
    })
  }

  function handleSpeakingWhileMuted() {
    notifyWarning('You are muted', 'You are speaking while muted. Unmute to be heard.')
  }

  function handleVideoAspectRatioChange(payload: Parameters<typeof event_video_aspect_ratio_change>[0]) {
    const { userId, aspectRatio } = payload
    const videoPlayerElement = document.querySelector(
      `[data-user-id="${userId}"] video-player`,
    ) as HTMLElement | null
    if (videoPlayerElement) {
      videoPlayerElement.style.aspectRatio = String(aspectRatio)
    }
  }

  return zoomSessionStore
}
