import { useEffect } from 'react';
import { Button, Center, Group, Stack, Text, Title } from '@mantine/core';
import { useZoomSessionStore } from '@/features/interview/zoom/useZoomSessionStore';
import { useAppStore } from '@/stores/useAppStore';
import { useDeviceStore } from '@/stores/useDeviceStore';
import { useZoomPreviewStore } from '@/stores/usePreviewStore';
import { MenuBar } from '../components/MenuBar';
import { PreviewTile } from './components/PreviewTile';

export function PrejoinScreen() {
  const toggleIsVideoOn = useAppStore((s) => s.toggleIsVideoOn);
  const toggleMuteMicrophone = useZoomPreviewStore((s) => s.toggleMuteMicrophone);

  const switchCamera = useZoomPreviewStore((s) => s.switchCamera);
  const switchMicrophone = useZoomPreviewStore((s) => s.switchMicrophone);

  const permissionState = useAppStore((s) => s.permissionState);

  const initZoom = useZoomSessionStore((s) => s.initClient);
  const initDevices = useDeviceStore((s) => s.initDevices);

  useEffect(() => {
    async function init() {
      await initZoom();
      await initDevices();
    }

    init();
  }, []);

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
