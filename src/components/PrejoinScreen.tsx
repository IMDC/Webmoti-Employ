import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Center, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useLocalMedia } from '@/hooks/useLocalMedia';
import { useAppStore } from '@/store';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { MenuBar } from './MenuBar';
import { ParticipantTile } from './ParticipantTile';

export function PrejoinScreen() {
  const navigate = useNavigate();

  const { stream, acquire, isAcquiring, startVideo, stopVideo, startAudio, stopAudio } =
    useLocalMedia();

  const isMediaDenied = useAppStore((state) => state.isMediaDenied);
  const toggleIsVideoOn = useAppStore((state) => state.toggleIsVideoOn);
  const isVideoOn = useAppStore((state) => state.isVideoOn);
  const toggleIsAudioOn = useAppStore((state) => state.toggleIsAudioOn);
  const isAudioOn = useAppStore((state) => state.isAudioOn);

  const attachLocalVideo = useCallback(
    (el: HTMLElement) => {
      const existing = el.querySelector('video');

      if (!stream || !isVideoOn) {
        if (existing) {
          existing.pause();
          existing.srcObject = null;
          existing.remove();
        }
        return;
      }

      let video = existing;
      if (!video) {
        video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        el.appendChild(video);
      }

      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
    },
    [stream, isVideoOn]
  );

  function join() {
    navigate('/room');
  }

  return (
    <Center mih="100vh">
      <Box pos="absolute" top={16} left={16}>
        <ColorSchemeToggle />
      </Box>

      <Group>
        <Stack>
          <ParticipantTile
            height={250}
            width={350}
            attach={attachLocalVideo}
            isVideoOn={isVideoOn && !isMediaDenied}
            mediaStreamTrack={stream?.getAudioTracks()[0]}
          />

          <MenuBar
            onToggleMic={async () => {
              if (isMediaDenied) {
                await acquire();
              } else {
                if (isAudioOn) {
                  stopAudio();
                } else {
                  await startAudio();
                }
                toggleIsAudioOn();
              }
            }}
            onToggleVideo={async () => {
              if (isMediaDenied) {
                await acquire();
              } else {
                if (isVideoOn) {
                  stopVideo();
                } else {
                  await startVideo();
                }
                toggleIsVideoOn();
              }
            }}
            isPrejoin
            disableMediaButtons={isAcquiring}
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
