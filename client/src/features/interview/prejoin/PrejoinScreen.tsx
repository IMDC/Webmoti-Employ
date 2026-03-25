import { AppShell, Box, Button, Card, Flex, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { useDocumentTitle } from '@mantine/hooks'
import { IconArrowLeft, IconLogin } from '@tabler/icons-react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Loading } from '@/components/Loading'
import { MyCopyButton } from '@/components/MyCopyButton'
import { RightHeader } from '@/components/RightHeader'
import { useUser } from '@/features/auth/hooks/useUserStore'
import { useDeviceStoreActions } from '@/features/interview/zoom/useDeviceStore'
import { useAppActions, useAppPermissionState } from '@/useAppStore'
import { HEADER_HEIGHT, HEADER_SIDE_PADDING, OUTER_TOOLBAR_HEIGHT } from '@/utils/constants'
import { logger } from '@/utils/logger'
import { isElectron } from '@/utils/utils'
import { useTranscriptionManager } from '../ai/TranscriptionManagerContext'
import { useIsZoomInitializing, useZoomCallState, useZoomSessionActions } from '../zoom/useZoomSessionStore'
import { ErrorScreen } from './components/ErrorScreen'
import { JoiningScreen } from './components/JoiningScreen'
import { PrejoinMenuBar } from './components/PrejoinMenuBar'
import { PreviewTile } from './components/PreviewTile'
import { useInterviewSession } from './queries'

export function PrejoinScreen() {
  useDocumentTitle('Pre-join | WebMoti')

  const navigate = useNavigate()

  const { initDevices } = useDeviceStoreActions()

  const callState = useZoomCallState()
  const isInitializing = useIsZoomInitializing()
  const { join, setIsVideoOn, setIsAudioOn } = useZoomSessionActions()

  const { setPermissionState } = useAppActions()
  const permissionState = useAppPermissionState()

  const user = useUser()
  const { id: sessionId } = useParams({ strict: false })

  const { startTranscriptionSession } = useTranscriptionManager()

  const userProfileUrl = user.image!
  const { interviewSession, isInterviewSessionPending, interviewSessionError }
    = useInterviewSession(sessionId)

  // Pre-connect to Speechmatics WebSocket so it's ready when joining the room
  useEffect(() => {
    if (interviewSession && !interviewSessionError) {
      startTranscriptionSession().catch((error) => {
        logger.error('Failed to pre-connect transcription session:', error)
      })
    }
  }, [interviewSession, interviewSessionError, startTranscriptionSession])

  useEffect(() => {
    // wait until the interview session query is successful before init devices
    // also wait until the sessionId is set in url
    if (!interviewSession || interviewSessionError || !sessionId) {
      return
    }

    const handleInitDevices = async () => {
      const permission = await initDevices()
      if (permission === 'denied') {
        setIsVideoOn(false)
        setIsAudioOn(false)
      }
    }

    handleInitDevices()
  }, [
    interviewSession,
    interviewSessionError,
    initDevices,
    setIsAudioOn,
    setIsVideoOn,
    setPermissionState,
    sessionId,
  ])

  useEffect(() => {
    if (callState === 'joined' && interviewSession) {
      sessionStorage.setItem('fromPrejoin', '1')
      navigate({
        to: '/interview/$id',
        params: { id: interviewSession.sessionId },
      })
    }
  }, [callState, interviewSession, navigate])

  // by adding !sessionId, it doesn't flicker in the moment before navigation
  if (isInterviewSessionPending || !sessionId) {
    return <Loading />
  }

  if (interviewSessionError) {
    return <ErrorScreen error={interviewSessionError} />
  }

  if (!interviewSession) {
    return null
  }

  return (
    <AppShell
      header={{ height: HEADER_HEIGHT }}
      styles={{
        header: {
          border: 'none',
          marginTop: isElectron() ? OUTER_TOOLBAR_HEIGHT : 0,
          paddingLeft: HEADER_SIDE_PADDING,
          paddingRight: HEADER_SIDE_PADDING,
        },
        main: {
          overflowX: 'hidden',
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        },
      }}
    >
      <AppShell.Header>
        <Flex justify="space-between" align="center" w="100vw" h="100%" p="lg" pl="xs">
          <Link to="/">
            <Button variant="subtle" leftSection={<IconArrowLeft size={16} />}>
              Dashboard
            </Button>
          </Link>

          {/* shift the header left to counteract the 100vw width */}
          <Box mr="sm">
            <RightHeader />
          </Box>
        </Flex>
      </AppShell.Header>

      <AppShell.Main>
        {/* stay visible when joined to avoid hiding while navigating */}
        <JoiningScreen visible={callState === 'joining' || callState === 'joined'} />

        <Flex justify="center" align="center" h="100%">
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="center"
            align="center"
            gap="xl"
            p={{ base: 'sm', sm: 'xl' }}
            m={{ base: 'sm', sm: 'xl' }}
          >
            <Card shadow="sm" radius="md" withBorder p="md">
              <Stack w={{ base: '70vw', sm: 350 }} maw={350}>
                <PreviewTile height={196.875} width={350} name={user.name} profileUrl={userProfileUrl} />

                <PrejoinMenuBar />
              </Stack>
            </Card>

            <Stack>
              <Title ta={{ base: 'center', sm: 'start' }}>
                Join Interview
              </Title>
              <Paper radius="md" p="xs" withBorder>
                <Group gap="xs">
                  <MyCopyButton copyText={interviewSession.sessionId} />
                  <Text ff="monospace" fz={{ base: 'xs', sm: 'sm', lg: 'lg' }}>{interviewSession.sessionId}</Text>
                </Group>
              </Paper>
              <Button
                size="md"
                leftSection={<IconLogin size={18} />}
                // it's very important to disable the button since if the client is still initializing, you can't join
                // this might still be a bug in the zoom store
                // Also for some reason you have to wait until permission is finalized,
                // otherwise client will be null. This is probably a bug.
                disabled={isInitializing || permissionState === 'acquiring'}
                onClick={async () =>
                  join(user.id, interviewSession.sessionId, interviewSession.token)}
              >
                Join
              </Button>
            </Stack>
          </Flex>
        </Flex>
      </AppShell.Main>
    </AppShell>
  )
}
