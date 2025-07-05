import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Button, Center, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useAppStore } from '@/stores/useAppStore';
import { useDeviceStore } from '@/stores/useDeviceStore';
import { useZoomPreviewStore } from '@/stores/usePreviewStore';
import { MenuBar } from '../components/MenuBar';
import { PreviewTile } from './components/PreviewTile';
import { InterviewSessionArgs, useInterviewSession } from './queries';

export function PrejoinScreen() {
  const toggleIsVideoOn = useAppStore((s) => s.toggleIsVideoOn);
  const toggleMuteMicrophone = useZoomPreviewStore((s) => s.toggleMuteMicrophone);

  const switchCamera = useZoomPreviewStore((s) => s.switchCamera);
  const switchMicrophone = useZoomPreviewStore((s) => s.switchMicrophone);

  const setError = useAppStore((s) => s.setError);
  const permissionState = useAppStore((s) => s.permissionState);

  const navigate = useNavigate();

  const initDevices = useDeviceStore((s) => s.initDevices);

  const { user } = useUser();
  const { id: sessionId } = useParams({ strict: false });

  if (!user) {
    setError({ message: 'User is null' });
    return null;
  }

  const userIdentity = getUserIdentity(user);
  const args = buildInterviewSessionArgs(sessionId, userIdentity);

  const { interviewSession, isInterviewSessionPending, interviewSessionError } =
    useInterviewSession(args);

  useEffect(() => {
    // wait until the interview session query is finished before init devices
    if (interviewSession) {
      useDeviceStore.getState().initDevices();
    }
  }, [interviewSession]);

  if (isInterviewSessionPending) {
    return (
      <Center mih="100vh">
        <Loader type="dots" />
      </Center>
    );
  }

  if (interviewSessionError) {
    return (
      <Center mih="100vh">
        <Stack>
          <Title>Error starting session</Title>
          <Text>{interviewSessionError.message}</Text>
          <Button onClick={() => navigate({ to: '/' })}>Exit Interview</Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Center mih="100vh">
      <Group>
        <Stack>
          <PreviewTile height={196.875} width={350} />

          <MenuBar
            onToggleMic={async () => {
              if (permissionState !== 'granted') {
                await initDevices();
                return;
              }
              toggleMuteMicrophone();
            }}
            onToggleVideo={async () => {
              if (permissionState !== 'granted') {
                await initDevices();
                return;
              }
              toggleIsVideoOn();
            }}
            onChangeAudioInputDevice={switchMicrophone}
            onChangeVideoDevice={switchCamera}
            isPrejoin
            disableMediaButtons={permissionState === 'idle' || permissionState === 'acquiring'}
          />
        </Stack>

        <Stack>
          <Title>Interview with Joe</Title>
          <Text>2 PM</Text>

          <Button>Join now</Button>
        </Stack>
      </Group>
    </Center>
  );
}

function getUserIdentity(user: { firstName: string | null; lastName: string | null } | null) {
  if (!user?.firstName || !user?.lastName) {
    throw new Error('User identity is incomplete');
  }
  return `${user.firstName} ${user.lastName}`;
}

function buildInterviewSessionArgs(
  sessionId: string | undefined,
  userIdentity: string
): InterviewSessionArgs {
  return sessionId
    ? { action: 'join', sessionId, userIdentity }
    : { action: 'create', userIdentity };
}
