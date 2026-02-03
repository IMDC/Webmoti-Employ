import type { ProfilesResponse } from '@webmoti-employ/shared'
import type { Participant } from '@zoom/videosdk'
import type { Dispatch, FC, RefObject, SetStateAction } from 'react'
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
import { GALLERY_VIEW_MARGIN, HEADER_HEIGHT } from '@/utils/constants'
import { useAiWebsocket } from '../ai/useAiWebsocket'
import { useBufferedTranscription } from '../ai/useBufferedTranscription'
import { Chat } from '../chat/Chat'
import { MenuBar } from '../components/MenuBar'
import { MobileMenuBar } from '../components/MobileMenuBar'
import { useParticipantProfiles } from '../profiles/useParticipantProfiles'
import { ChangeLayoutModal } from './components/ChangeLayoutModal/ChangeLayoutModal'
import { FeedbackArea } from './components/FeedbackArea'
import { SpotlightView } from './components/SpotlightView'
import { VideoGrid } from './components/VideoGrid'
import { useFaceDetection } from './hooks/useFaceDetection'

export interface LayoutProps {
  containerRef: RefObject<HTMLDivElement | null>
  setHostVideo: Dispatch<SetStateAction<HTMLVideoElement | null>>
  participants: Map<number, Participant>
  isLoadingProfiles: boolean
  profiles?: ProfilesResponse
  faceDetectionResult?: InterviewerCoordinates | null
  isLookingAtInterviewer?: boolean
}

export function Room() {
  const participantStageRef = useRef<HTMLDivElement>(null)

  const [isChatOpen, setIsChatOpen] = useState(false)

  const { sendTranscript, notification, sendDevIsJohnDoNotUseMessage } = useAiWebsocket()
  useBufferedTranscription(5, sendTranscript)

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
  const faceDetectionResult = useFaceDetection(hostVideo, 10)

  const [isLayoutModalOpen, { open: openLayoutModal, close: closeLayoutModal }]
    = useDisclosure(false)
  const [layout, setLayout] = useState<LayoutValue>('spotlight')
  const layoutComponents: Record<LayoutValue, FC<LayoutProps>> = {
    spotlight: SpotlightView,
    grid: VideoGrid,
  }
  const LayoutComponent = layoutComponents[layout]

  const [isLookingAtInterviewer, setIsLookingAtInterviewer] = useState(false)

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
      footer={{ height: HEADER_HEIGHT }}
      styles={{
        main: { height: `calc(100vh - ${HEADER_HEIGHT}px)` },
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
                id="feedback-safe-aoi"
              >
                <FeedbackArea
                  notification={notification}
                  onLookingChange={setIsLookingAtInterviewer}
                />
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
                <LayoutComponent
                  containerRef={participantStageRef}
                  setHostVideo={setHostVideo}
                  participants={participants}
                  profiles={profiles}
                  isLoadingProfiles={isLoadingProfiles}
                  faceDetectionResult={faceDetectionResult}
                  isLookingAtInterviewer={isLookingAtInterviewer}
                />
              </Flex>
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
                isChatOpen={isChatOpen}
                onToggleChat={() => {
                  setIsChatOpen(!isChatOpen)
                }}
                onToggleLayoutModal={openLayoutModal}
                sendDevIsJohnDoNotUseThis={sendDevIsJohnDoNotUseMessage}
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
