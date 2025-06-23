import { Corner } from '@/components/Corner';
import { Card, Text } from '@mantine/core';
import { NoVideoBackground } from './NoVideoBackground';

interface ParticipantTileProps {
  height: number | string;
  width: number | string;
  name?: string;
  showAvatarFallback?: boolean;
  children: React.ReactNode;
}

export function ParticipantTile({
  height,
  width,
  name,
  showAvatarFallback = false,
  children,
}: ParticipantTileProps) {
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
      {showAvatarFallback && <NoVideoBackground />}

      {children}

      {name && (
        <Corner>
          <Text size="sm" c="white">
            {name}
          </Text>
        </Corner>
      )}
    </Card>
  );
}
