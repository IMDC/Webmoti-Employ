import { useEffect } from 'react';
import { Box, Button, Center, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle';
import { useZoomSessionStore } from '@/features/video/zoom/useZoomSessionStore';
import { useAppStore } from '@/stores/useAppStore';
import { useDeviceStore } from '@/stores/useDeviceStore';
import { useZoomPreviewStore } from '@/stores/usePreviewStore';
import { MenuBar } from '../components/MenuBar';
import { PreviewTile } from './PreviewTile';

interface PrejoinScreenProps {
  onJoin: () => void;
}

export function PrejoinScreen({ onJoin }: PrejoinScreenProps) {
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
      <Box pos="absolute" top={16} left={16}>
        <ColorSchemeToggle />
      </Box>

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

          <TextInput placeholder="Your name" />

          <Button onClick={onJoin}>Join now</Button>
        </Stack>
      </Group>
    </Center>
  );
}
