import { useCallback, useEffect, useRef } from 'react';
import { Box, Button, Center, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useZoomPreviewStore } from '@/stores/ZoomPreviewStore';
import { useZoomVideoStore } from '@/stores/ZoomVideoStore';
import { ColorSchemeToggle } from '../ColorSchemeToggle';
import { MenuBar } from '../MenuBar';
import { LocalPreview } from '../participant/LocalPreview';

interface PrejoinScreenProps {
  onJoin: () => void;
}

export function PrejoinScreen({ onJoin }: PrejoinScreenProps) {
  // const isMediaDenied = useAppStore((state) => state.isMediaDenied);
  // const toggleIsVideoOn = useAppStore((state) => state.toggleIsVideoOn);
  // const isVideoOn = useAppStore((state) => state.isVideoOn);
  // const toggleIsAudioOn = useAppStore((state) => state.toggleIsAudioOn);
  // const isAudioOn = useAppStore((state) => state.isAudioOn);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = useZoomPreviewStore((store) => store.startCamera);
  const initZoom = useZoomVideoStore((store) => store.initClient);

  useEffect(() => {
    async function init() {
      await initZoom();
    }

    init();
  }, []);

  const attachLocalVideo = useCallback(
    (el: HTMLElement) => {
      if (videoRef.current) {
        return;
      }

      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';

      el.appendChild(video);
      videoRef.current = video;

      startCamera(video);
    },
    [startCamera]
  );

  return (
    <Center mih="100vh">
      <Box pos="absolute" top={16} left={16}>
        <ColorSchemeToggle />
      </Box>

      <Group>
        <Stack>
          <LocalPreview height={250} width={350} attach={attachLocalVideo} />

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
