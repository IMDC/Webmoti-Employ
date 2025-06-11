import { useNavigate } from 'react-router-dom';
import { Button, Center, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useLocalMedia } from '@/hooks/useLocalMedia';
import { useAppStore } from '@/store';
import { MenuBar } from './MenuBar';
import { ParticipantTile } from './ParticipantTile';

export function PrejoinScreen() {
  const navigate = useNavigate();

  const { stream, acquire } = useLocalMedia();

  const isMediaDenied = useAppStore((state) => state.isMediaDenied);
  const toggleIsVideoOn = useAppStore((state) => state.toggleIsVideoOn);
  const isVideoOn = useAppStore((state) => state.isVideoOn);
  const toggleIsAudioOn = useAppStore((state) => state.toggleIsAudioOn);

  function attachLocalVideo(el: HTMLElement) {
    if (!stream) {
      return;
    }

    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';

    el.replaceChildren(video);
  }

  function join() {
    navigate('/room');
  }

  return (
    <Center mih="100vh">
      <Group>
        <Stack>
          <ParticipantTile
            height={250}
            width={350}
            attach={attachLocalVideo}
            isVideoOn={isVideoOn && !isMediaDenied}
          />

          <MenuBar
            onToggleMic={() => {
              if (isMediaDenied) {
                acquire();
              } else {
                toggleIsAudioOn();
              }
            }}
            onToggleVideo={() => {
              if (isMediaDenied) {
                acquire();
              } else {
                toggleIsVideoOn();
              }
            }}
            isPrejoin
          />
        </Stack>

        <Stack>
          <Title>Interview with Joe</Title>
          <Text>2 PM</Text>

          <TextInput placeholder="Your name" />

          <Button onClick={join}>Join now</Button>
        </Stack>
      </Group>
    </Center>
  );
}
