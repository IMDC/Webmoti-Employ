import type { InterviewSessionArgs } from './queries'
import { useUser } from '@clerk/clerk-react'
import { AppShell, Button, Center, Flex, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { MyCopyButton } from '@/components/MyCopyButton'
import { RightHeader } from '@/components/RightHeader'
import { useDeviceStore } from '@/features/interview/zoom/useDeviceStore'
import { getUserIdentity } from '@/utils/utils'
import { useZoomSessionStore } from '../zoom/useZoomSessionStore'
import { ErrorScreen } from './components/ErrorScreen'
import { JoiningScreen } from './components/JoiningScreen'
import { PrejoinMenuBar } from './components/PrejoinMenuBar'
import { PreviewTile } from './components/PreviewTile'
import { useInterviewSession } from './queries'

export function PrejoinScreen() {
  const navigate = useNavigate()

  const initDevices = useDeviceStore(s => s.initDevices)

  const callState = useZoomSessionStore(s => s.callState)
  const joinZoom = useZoomSessionStore(s => s.join)
  const setIsVideoOn = useZoomSessionStore(s => s.setIsVideoOn)
  const setIsAudioOn = useZoomSessionStore(s => s.setIsAudioOn)

  const { user } = useUser()
  const { id: sessionId } = useParams({ strict: false })

  const userIdentity = getUserIdentity(user!)
  const userId = user!.id
  const userProfileUrl = user!.imageUrl
  const args = buildInterviewSessionArgs(sessionId, userIdentity)

  const { interviewSession, isInterviewSessionPending, interviewSessionError }
    = useInterviewSession(args)

  useEffect(() => {
    // wait until the interview session query is successful before init devices
    if (!interviewSession || interviewSessionError)
      return

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

  if (isInterviewSessionPending) {
    return (
      <Center mih="100vh">
        <Loader type="dots" />
      </Center>
    )
  }

  if (interviewSessionError) {
    return <ErrorScreen error={interviewSessionError} />
  }

  if (!interviewSession) {
    return null
  }

  return (
    <AppShell
      header={{ height: 60 }}
      styles={{
        header: { border: 'none' },
        main: { overflowX: 'hidden', height: 'calc(100vh - 60px)' },
      }}
    >
      <AppShell.Header>
        <Flex justify="space-between" align="center" w="100vw" h="100%" p="lg" pl="xs">
          <Link to="/">
            <Button variant="subtle">
              ← Back to Dashboard
            </Button>
          </Link>

          <RightHeader />
        </Flex>
      </AppShell.Header>

      <AppShell.Main>
        {/* stay visible when joined to avoid hiding while navigating */}
        <JoiningScreen visible={callState === 'joining' || callState === 'joined'} />

        <Flex justify="center" align="center" h="100%">
          <Group justify="center" p="xl" m="xl">
            <Stack>
              <PreviewTile height={196.875} width={350} name={userIdentity} profileUrl={userProfileUrl} />

              <PrejoinMenuBar />
            </Stack>

            <Stack>
              <Title ta={{ base: 'center', sm: 'start' }}>
                {`${args.action === 'create' ? 'New' : 'Join'} Interview`}
              </Title>
              <Group>
                <MyCopyButton copyText={interviewSession.sessionId} />
                <Text ff="monospace" fz={{ base: 'xs', sm: 'sm', lg: 'lg' }}>{interviewSession.sessionId}</Text>
              </Group>
              <Button
                onClick={async () =>
                  joinZoom(userId, interviewSession.sessionId, interviewSession.token)}
              >
                {`${args.action === 'create' ? 'Start' : 'Join'}`}
              </Button>
            </Stack>
          </Group>
        </Flex>
      </AppShell.Main>
    </AppShell>
  )
}

function buildInterviewSessionArgs(
  sessionId: string | undefined,
  userIdentity: string,
): InterviewSessionArgs {
  return sessionId
    ? { action: 'join', sessionId, userIdentity }
    : { action: 'create', userIdentity }
}
