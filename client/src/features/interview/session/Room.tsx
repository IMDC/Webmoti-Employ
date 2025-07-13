import { AppShell, Box, em, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useDeviceStore } from '@/features/interview/zoom/useDeviceStore'
import { useZoomSessionStore } from '@/features/interview/zoom/useZoomSessionStore'
import { useAppStore } from '@/useAppStore'
import { GALLERY_VIEW_MARGIN } from '@/utils/constants'
import { Chat } from '../chat/Chat'
import { MenuBar } from '../components/MenuBar'
import { MobileMenuBar } from '../components/MobileMenuBar'
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
  const switchCamera = useZoomSessionStore(s => s.switchCamera)
  const switchMicrophone = useZoomSessionStore(s => s.switchMicrophone)
  const callState = useZoomSessionStore(s => s.callState)

  const navigate = useNavigate()

  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${em(theme.breakpoints.sm)})`)

  const participants = useZoomSessionStore(store => store.participants)
  const { profiles, isLoadingProfiles } = useParticipantProfiles(participants)

  async function onToggleMic() {
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
  }

  async function onToggleVideo() {
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
  }

  useEffect(() => {
    if (callState === 'left') {
      sessionStorage.setItem('fromInterview', '1')
      navigate({ to: '/end' })
    }
  }, [callState, navigate])

  return (
    <AppShell
      footer={{ height: '60px' }}
      styles={{
        main: { height: 'calc(100vh - 60px)' },
        footer: { border: 'none' },
      }}
    >
      <AppShell.Main>
        <Box display="flex" h="100%">
          {/* chat takes up full width when open on mobile */}
          {!(isMobile && isChatOpen) && (
            <Box
              ref={participantStageRef}
              flex={1}
              miw={0}
              p={GALLERY_VIEW_MARGIN}
              display="flex"
              style={{
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignContent: 'center',
                gap: GALLERY_VIEW_MARGIN,
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
              h="100%"
              w={{ base: '100%', sm: '35%', lg: '30%' }}
              p="lg"
            >
              <Chat />
            </Box>
          )}
        </Box>
      </AppShell.Main>

      <AppShell.Footer>
        {!isMobile
          ? (
              <MenuBar
                onToggleMic={onToggleMic}
                onToggleVideo={onToggleVideo}
                onChangeAudioInputDevice={switchMicrophone}
                onChangeVideoDevice={switchCamera}
                onToggleChat={() => {
                  setIsChatOpen(!isChatOpen)
                }}
              />
            )
          : (
              <MobileMenuBar
                onToggleMic={onToggleMic}
                onToggleVideo={onToggleVideo}
                onToggleChat={() => {
                  setIsChatOpen(!isChatOpen)
                }}
              />
            )}
      </AppShell.Footer>
    </AppShell>
  )
}
