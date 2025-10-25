import type { LayoutValue } from './components/ChangeLayoutModal/ChangeLayoutModal'
import { AppShell, Box, em, Flex, Stack, useMantineTheme } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useDeviceStoreActions } from '@/features/interview/zoom/useDeviceStore'
import {
  useIsAudioOn,
  useIsVideoOn,
  useZoomCallState,
  useZoomParticipants,
  useZoomSessionActions,
} from '@/features/interview/zoom/useZoomSessionStore'
import { useAppPermissionState } from '@/useAppStore'
import { GALLERY_VIEW_MARGIN } from '@/utils/constants'
import { useAiWebsocket } from '../ai/useAiWebsocket'
import { useTranscription } from '../ai/useTranscription'
import { Chat } from '../chat/Chat'
import { MenuBar } from '../components/MenuBar'
import { MobileMenuBar } from '../components/MobileMenuBar'
import { useParticipantProfiles } from '../profiles/useParticipantProfiles'
import { ChangeLayoutModal } from './components/ChangeLayoutModal/ChangeLayoutModal'
import { FeedbackArea } from './components/FeedbackArea'
import { SpotlightView } from './components/SpotlightView'
import { VideoGrid } from './components/VideoGrid'
import { useFaceDetection } from './hooks/useFaceDetection'

export function Room() {
  const participantStageRef = useRef<HTMLDivElement>(null)

  const [isChatOpen, setIsChatOpen] = useState(false)
  // const [isCaptionsAreaOpen, setIsCaptionsAreaOpen] = useState(false)

  const { sendTranscript, notification } = useAiWebsocket()
  useTranscription(5, sendTranscript)

  const permissionState = useAppPermissionState()

  const {
    setIsVideoOn,
    setIsAudioOn,
    startVideo,
    stopVideo,
    startAudio,
    stopAudio,
  } = useZoomSessionActions()
  const isVideoOn = useIsVideoOn()
  const isAudioOn = useIsAudioOn()
  const callState = useZoomCallState()

  // TODO maybe remove this in favour of startVideo permission check
  const { initDevices } = useDeviceStoreActions()

  const navigate = useNavigate()

  const { id } = useParams({ from: '/(authenticated)/interview/$id' })

  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${em(theme.breakpoints.sm)})`)

  const participants = useZoomParticipants()
  const { profiles, isLoadingProfiles } = useParticipantProfiles(participants)

  const [hostVideo, setHostVideo] = useState<HTMLVideoElement | null>(null)
  useFaceDetection(hostVideo, 5)

  const [isLayoutModalOpen, { open: openLayoutModal, close: closeLayoutModal }]
    = useDisclosure(false)
  const [layout, setLayout] = useState<LayoutValue>('spotlight')

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
      navigate({ to: '/end/$id', params: { id } })
    }
  }, [callState, navigate, id])

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
            <Stack w="100%" gap={0}>
              <Box
                w="100%"
                h={{ base: '12%', xl: '15%' }}
              >
                <FeedbackArea notification={notification} />
              </Box>

              <Flex
                ref={participantStageRef}
                flex={1}
                miw={0}
                mih={0}
                p={GALLERY_VIEW_MARGIN}
                display="flex"
                justify="center"
                align="center"
                gap={GALLERY_VIEW_MARGIN}
                wrap="wrap"
                // relative is for spotlight view
                pos="relative"
              >
                {layout === 'spotlight'
                  ? (
                      <SpotlightView
                        containerRef={participantStageRef}
                        setHostVideo={setHostVideo}
                        participants={participants}
                        profiles={profiles}
                        isLoadingProfiles={isLoadingProfiles}
                      />
                    )
                  : (
                      <VideoGrid
                        containerRef={participantStageRef}
                        setHostVideo={setHostVideo}
                        participants={participants}
                        profiles={profiles}
                        isLoadingProfiles={isLoadingProfiles}
                      />
                    )}
              </Flex>

              {/* {isCaptionsAreaOpen && (
                <Box
                  w="100%"
                  h="25%"
                >
                  <CaptionsArea />
                </Box>
              )} */}
            </Stack>
          )}

          {isChatOpen && (
            <Box
              h="100%"
              w={{ base: '100%', sm: '35%', lg: '30%' }}
              p="lg"
            >
              <Chat
                onClose={() => setIsChatOpen(false)}
                profiles={profiles}
                isLoadingProfiles={isLoadingProfiles}
              />
            </Box>
          )}
        </Box>

        <ChangeLayoutModal
          isOpen={isLayoutModalOpen}
          onClose={closeLayoutModal}
          layout={layout}
          onChangeLayout={setLayout}
        />
      </AppShell.Main>

      <AppShell.Footer>
        {!isMobile
          ? (
              <MenuBar
                onToggleMic={onToggleMic}
                onToggleVideo={onToggleVideo}
                // isCaptionsAreaOpen={isCaptionsAreaOpen}
                // toggleCaptionsArea={() => setIsCaptionsAreaOpen(o => !o)}
                isChatOpen={isChatOpen}
                onToggleChat={() => {
                  setIsChatOpen(!isChatOpen)
                }}
                onToggleLayoutModal={openLayoutModal}
              />
            )
          : (
              <MobileMenuBar
                onToggleMic={onToggleMic}
                onToggleVideo={onToggleVideo}
                isChatOpen={isChatOpen}
                onToggleChat={() => {
                  setIsChatOpen(!isChatOpen)
                }}
                onToggleLayoutModal={openLayoutModal}
              />
            )}
      </AppShell.Footer>
    </AppShell>
  )
}
