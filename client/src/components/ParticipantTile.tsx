import { useEffect, useRef } from 'react';
import { Avatar, Box, Card, Center, Text } from '@mantine/core';
import AudioLevelIndicator from './AudioLevelIndicator';

interface ParticipantTileProps {
  name?: string;
  isMuted?: boolean;
  isVideoOn?: boolean;
  isSpeaking?: boolean;
  attach?: (el: HTMLElement) => void;
  height: number | string;
  width: number | string;
  mediaStreamTrack?: MediaStreamTrack;
}

function getRandomColorPair() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70;
  const lightness1 = 65;
  const lightness2 = 55;

  return {
    gradient: `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightness1}%), hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness2}%))`,
    avatar: `hsl(${hue}, ${saturation}%, 50%)`,
  };
}

export function ParticipantTile({
  name,
  isMuted,
  isVideoOn,
  attach,
  height,
  width,
  mediaStreamTrack,
}: ParticipantTileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { gradient, avatar } = useRef(getRandomColorPair()).current;

  useEffect(() => {
    const container = containerRef.current;
    if (container && attach) {
      attach(container);
    }
  }, [attach, isVideoOn]);

  return (
    <Card
      h={height}
      w={width}
      p={0}
      radius="lg"
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {!isVideoOn && (
        <>
          <Box
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: gradient,
              filter: 'blur(20px)',
            }}
          />
          <Center
            w="100%"
            h="100%"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <Avatar
              style={{
                backgroundColor: avatar,
                height: 'clamp(50px, 25%, 150px)',
                width: 'auto',
                aspectRatio: '1 / 1',
              }}
            />
          </Center>
        </>
      )}

      <Box ref={containerRef} w="100%" h="100%" />

      {name && (
        <Text
          size="sm"
          c="white"
          style={{
            position: 'absolute',
            bottom: 6,
            left: 8,
            zIndex: 1,
          }}
        >
          {name}
        </Text>
      )}

      {mediaStreamTrack && (
        <Box
          style={{
            position: 'absolute',
            bottom: 6,
            left: 8,
            zIndex: 1,
          }}
        >
          <AudioLevelIndicator mediaStreamTrack={mediaStreamTrack} isTrackEnabled={!isMuted} />
        </Box>
      )}
    </Card>
  );
}
