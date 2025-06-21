import { useEffect } from 'react';
import { Box, Button, Center, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useZoomPreviewStore } from '@/stores/ZoomPreviewStore';
import { useZoomVideoStore } from '@/stores/ZoomVideoStore';
import { ColorSchemeToggle } from '../ColorSchemeToggle';
import { MenuBar } from '../MenuBar';
import { PreviewTile } from '../PreviewTile';

interface PrejoinScreenProps {
  onJoin: () => void;
}

export function PrejoinScreen({ onJoin }: PrejoinScreenProps) {
  // const isMediaDenied = useAppStore((state) => state.isMediaDenied);
  // const toggleIsVideoOn = useAppStore((state) => state.toggleIsVideoOn);
  // const isVideoOn = useAppStore((state) => state.isVideoOn);
  // const toggleIsAudioOn = useAppStore((state) => state.toggleIsAudioOn);
  // const isAudioOn = useAppStore((state) => state.isAudioOn);

  // const videoRef = useRef<HTMLVideoElement | null>(null);

  const initZoom = useZoomVideoStore((s) => s.initClient);
  const initDevices = useZoomPreviewStore((s) => s.initDevices);

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
            onToggleMic={async () => {}}
            onToggleVideo={async () => {}}
            isPrejoin
            disableMediaButtons={false}
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
