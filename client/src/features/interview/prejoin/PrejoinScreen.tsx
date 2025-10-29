import { AppShell, Button, Flex, Group, Stack, Text, Title } from '@mantine/core'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Loading } from '@/components/Loading'
import { MyCopyButton } from '@/components/MyCopyButton'
import { RightHeader } from '@/components/RightHeader'
import { useUser } from '@/features/auth/hooks/useUserStore'
import { useDeviceStoreActions } from '@/features/interview/zoom/useDeviceStore'
import { useAppActions, useAppPermissionState } from '@/useAppStore'
import { useIsZoomInitializing, useZoomCallState, useZoomSessionActions } from '../zoom/useZoomSessionStore'
import { ErrorScreen } from './components/ErrorScreen'
import { JoiningScreen } from './components/JoiningScreen'
import { PrejoinMenuBar } from './components/PrejoinMenuBar'
import { PreviewTile } from './components/PreviewTile'
import { useInterviewSession } from './queries'

export function PrejoinScreen() {
  const navigate = useNavigate()

  const { initDevices } = useDeviceStoreActions()

  const callState = useZoomCallState()
  const isInitializing = useIsZoomInitializing()
  const { join, setIsVideoOn, setIsAudioOn } = useZoomSessionActions()

  const { setPermissionState } = useAppActions()
  const permissionState = useAppPermissionState()

  const user = useUser()
  const { id: sessionId } = useParams({ strict: false })

  const userProfileUrl = user.image!
  const { interviewSession, isInterviewSessionPending, interviewSessionError }
    = useInterviewSession(sessionId)

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
            <Stack w={350}>
              <PreviewTile height={196.875} width={350} name={user.name} profileUrl={userProfileUrl} />

              <PrejoinMenuBar />
            </Stack>

            <Stack>
              <Title ta={{ base: 'center', sm: 'start' }}>
                {`${sessionId ? 'Join' : 'New'} Interview`}
              </Title>
              <Group>
                <MyCopyButton copyText={interviewSession.sessionId} />
                <Text ff="monospace" fz={{ base: 'xs', sm: 'sm', lg: 'lg' }}>{interviewSession.sessionId}</Text>
              </Group>
              <Button
                // it's very important to disable the button since if the client is still initializing, you can't join
                // this might still be a bug in the zoom store
                // Also for some reason you have to wait until permission is finalized,
                // otherwise client will be null. This is probably a bug.
                disabled={isInitializing || permissionState === 'acquiring'}
                onClick={async () =>
                  join(user.id, interviewSession.sessionId, interviewSession.token)}
              >
                {sessionId ? 'Join' : 'Start'}
              </Button>
            </Stack>
          </Group>
        </Flex>
      </AppShell.Main>
    </AppShell>
  )
}
