import { useNavigate } from 'react-router-dom';
import { Button, Center, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useLocalMedia } from '@/hooks/useLocalMedia';
import { ParticipantTile } from './ParticipantTile';

export function PrejoinScreen() {
  const navigate = useNavigate();

  const localStream = useLocalMedia();

  function attachLocalVideo(el: HTMLElement) {
    if (!localStream) {
      return;
    }

    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.srcObject = localStream;
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
        <ParticipantTile height={200} width={300} attach={attachLocalVideo} />

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
