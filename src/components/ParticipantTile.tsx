import { useEffect, useRef } from 'react';
import { IconMicrophoneOff } from '@tabler/icons-react';
import { Box, Card, Text } from '@mantine/core';

type ParticipantTileProps = {
  name?: string;
  isMuted?: boolean;
  isSpeaking?: boolean;
  attach?: (el: HTMLElement) => void;
  height: number | string;
  width: number | string;
};

export function ParticipantTile({
  name,
  isMuted,
  isSpeaking,
  attach,
  height,
  width,
}: ParticipantTileProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container && attach) {
      attach(container);
    }
    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [attach]);

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

      {isMuted && (
        <Box
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            zIndex: 1,
          }}
        >
          <IconMicrophoneOff size={16} />
        </Box>
      )}
    </Card>
  );
}
