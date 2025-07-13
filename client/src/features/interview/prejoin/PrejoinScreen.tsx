import type { InterviewSessionArgs } from './queries'
import { UserButton, useUser } from '@clerk/clerk-react'
import { AppShell, Button, Center, Flex, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { MyCopyButton } from '@/components/MyCopyButton'
import { SettingsButton } from '@/components/SettingsButton'
import { usePreviewStore } from '@/features/interview/prejoin/hooks/usePreviewStore'
import { useDeviceStore } from '@/features/interview/zoom/useDeviceStore'
import { useAppStore } from '@/useAppStore'
import { getUserIdentity } from '@/utils/utils'
import { MenuBar } from '../components/MenuBar'
import { useZoomSessionStore } from '../zoom/useZoomSessionStore'
import { ErrorScreen } from './components/ErrorScreen'
import { JoiningScreen } from './components/JoiningScreen'
import { PreviewTile } from './components/PreviewTile'
import { useInterviewSession } from './queries'

export function PrejoinScreen() {
  const toggleIsVideoOn = useAppStore(s => s.toggleIsVideoOn)
  const toggleMuteMicrophone = usePreviewStore(s => s.toggleMuteMicrophone)

  const switchCamera = usePreviewStore(s => s.switchCamera)
  const switchMicrophone = usePreviewStore(s => s.switchMicrophone)

  const permissionState = useAppStore(s => s.permissionState)

  const navigate = useNavigate()

  const initDevices = useDeviceStore(s => s.initDevices)

  const callState = useZoomSessionStore(s => s.callState)
  const joinZoom = useZoomSessionStore(s => s.join)

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
    if (interviewSession && !interviewSessionError) {
      initDevices()
    }
  }, [interviewSession, interviewSessionError, initDevices])

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
        main: { height: 'calc(100vh - 60px)' },
      }}
    >
      <AppShell.Header>
        <Flex justify="space-between" align="center" w="100vw" h="100%" p="lg">
          <Button variant="subtle" onClick={() => navigate({ to: '/' })}>
            ← Back to Dashboard
          </Button>

          <Group>
            <SettingsButton />
            <UserButton />
          </Group>
        </Flex>
      </AppShell.Header>

      <AppShell.Main>
        {/* stay visible when joined to avoid hiding while navigating */}
        <JoiningScreen visible={callState === 'joining' || callState === 'joined'} />

        <Flex justify="center" align="center" h="100%">
          <Group justify="center" p="xl" m="xl">
            <Stack>
              <PreviewTile height={196.875} width={350} name={userIdentity} profileUrl={userProfileUrl} />

              <MenuBar
                onToggleMic={async () => {
                  if (permissionState !== 'granted') {
                    await initDevices()
                    return
                  }
                  toggleMuteMicrophone()
                }}
                onToggleVideo={async () => {
                  if (permissionState !== 'granted') {
                    await initDevices()
                    return
                  }
                  toggleIsVideoOn()
                }}
                onChangeAudioInputDevice={switchMicrophone}
                onChangeVideoDevice={switchCamera}
                isPrejoin
              />
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
