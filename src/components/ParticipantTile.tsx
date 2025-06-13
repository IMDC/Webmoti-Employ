import { useEffect, useRef } from 'react';
import { Avatar, Box, Card, Center, Text } from '@mantine/core';
import AudioLevelIndicator from './AudioLevelIndicator';

type ParticipantTileProps = {
  name?: string;
  isMuted?: boolean;
  isVideoOn?: boolean;
  isSpeaking?: boolean;
  attach?: (el: HTMLElement) => void;
  height: number | string;
  width: number | string;
  mediaStreamTrack?: MediaStreamTrack;
};

export function ParticipantTile({
  name,
  isMuted,
  isVideoOn,
  isSpeaking,
  attach,
  height,
  width,
  mediaStreamTrack,
}: ParticipantTileProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
      withBorder
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'black',
        border: isSpeaking ? '2px solid lime' : '1px solid #444',
      }}
    >
      {!isVideoOn && (
        <Center w="100%" h="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          <Avatar size={100} />
        </Center>
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
