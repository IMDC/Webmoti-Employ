import { AppShell, Box, em, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useBlocker, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useDeviceStore } from '@/features/interview/zoom/useDeviceStore'
import { useZoomSessionStore } from '@/features/interview/zoom/useZoomSessionStore'
import { useAppStore } from '@/useAppStore'
import { GALLERY_VIEW_MARGIN } from '@/utils/constants'
import { Chat } from '../chat/Chat'
import { useChatStore } from '../chat/useChatStore'
import { MenuBar } from '../components/MenuBar'
import { useParticipantProfiles } from '../profiles/useParticipantProfiles'
import { VideoGrid } from './components/VideoGrid'

export function Room() {
  const participantStageRef = useRef<HTMLDivElement>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const permissionState = useAppStore(s => s.permissionState)
  const isVideoOn = useAppStore(s => s.isVideoOn)
  const setIsVideoOn = useAppStore(s => s.setIsVideoOn)
  const isAudioOn = useAppStore(s => s.isAudioOn)
  const setIsAudioOn = useAppStore(s => s.setIsAudioOn)

  // TODO maybe remove this in favour of startVideo permission check
  const initDevices = useDeviceStore(s => s.initDevices)

  const startVideo = useZoomSessionStore(s => s.startVideo)
  const stopVideo = useZoomSessionStore(s => s.stopVideo)
  const startAudio = useZoomSessionStore(s => s.startAudio)
  const stopAudio = useZoomSessionStore(s => s.stopAudio)
  const leave = useZoomSessionStore(s => s.leave)
  const switchCamera = useZoomSessionStore(s => s.switchCamera)
  const switchMicrophone = useZoomSessionStore(s => s.switchMicrophone)
  const callState = useZoomSessionStore(s => s.callState)

  const isChatUnread = useChatStore(s => s.isChatUnread)

  const navigate = useNavigate()

  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${em(theme.breakpoints.sm)})`)

  const participants = useZoomSessionStore(store => store.participants)
  const { profiles, isLoadingProfiles, profilesError } = useParticipantProfiles(participants)

  useEffect(() => {
    if (callState === 'left') {
      navigate({ to: '/end', state: prev => ({ ...prev, stage: 'interview' }) })
    }
  }, [callState, navigate])

  useBlocker({
    shouldBlockFn: () => {
      // eslint-disable-next-line no-alert
      const shouldLeave = window.confirm('Are you sure you want to leave?')
      return !shouldLeave
    },
  })

  return (
    <AppShell
      footer={{ height: '60px' }}
      styles={{
        main: { height: 'calc(100vh - 60px)' },
        footer: { border: 'none' },
      }}
    >
      <AppShell.Main>
        <Box
          style={{
            display: 'flex',
            height: '100%',
          }}
        >
          {/* chat takes up full width when open on mobile */}
          {!(isMobile && isChatOpen) && (
            <Box
              ref={participantStageRef}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignContent: 'center',
                gap: GALLERY_VIEW_MARGIN,
                padding: GALLERY_VIEW_MARGIN,
                flex: 1,
                minWidth: 0,
              }}
            >
              <VideoGrid
                containerRef={participantStageRef}
                participants={participants}
                profiles={profiles}
                isLoadingProfiles={isLoadingProfiles}
              />
            </Box>
          )}

          {isChatOpen && (
            <Box
              style={{
                width: isMobile ? '100%' : '30%',
                height: '100%',
              }}
              p="lg"
            >
              <Chat />
            </Box>
          )}
        </Box>
      </AppShell.Main>

      <AppShell.Footer>
        <MenuBar
          onToggleMic={async () => {
            if (permissionState !== 'granted') {
              await initDevices()
              return
            }

            if (isAudioOn) {
              setIsAudioOn(false)
              await stopAudio()
            }
            else {
              setIsAudioOn(true)
              await startAudio()
            }
          }}
          onToggleVideo={async () => {
            if (permissionState !== 'granted') {
              await initDevices()
              return
            }

            if (isVideoOn) {
              setIsVideoOn(false)
              await stopVideo()
            }
            else {
              setIsVideoOn(true)
              await startVideo()
            }
          }}
          onChangeAudioInputDevice={switchMicrophone}
          onChangeVideoDevice={switchCamera}
          onToggleChat={() => {
            setIsChatOpen(!isChatOpen)
          }}
          onLeave={leave}
          isChatUnread={isChatUnread}
        />
      </AppShell.Footer>
    </AppShell>
  )
}
