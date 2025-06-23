import { useEffect } from 'react';
import { Box, Button, Center, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle';
import { useAppStore } from '@/stores/useAppStore';
import { useZoomPreviewStore } from '@/stores/usePreviewStore';
import { useZoomVideoStore } from '@/stores/useZoomVideoStore';
import { MenuBar } from '../components/MenuBar';
import { PreviewTile } from './PreviewTile';
import { useDeviceStore } from '@/stores/useDeviceStore';

interface PrejoinScreenProps {
  onJoin: () => void;
}

export function PrejoinScreen({ onJoin }: PrejoinScreenProps) {
  const toggleIsVideoOn = useAppStore((s) => s.toggleIsVideoOn);
  const toggleMuteMicrophone = useZoomPreviewStore((s) => s.toggleMuteMicrophone);

  const permissionState = useAppStore((s) => s.permissionState);

  const initZoom = useZoomVideoStore((s) => s.initClient);
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
              }
              toggleMuteMicrophone();
            }}
            onToggleVideo={async () => {
              if (permissionState !== 'granted') {
                await initDevices();
              }
              toggleIsVideoOn();
            }}
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
