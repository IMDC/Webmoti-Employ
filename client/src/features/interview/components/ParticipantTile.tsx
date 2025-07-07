import { Card, Text } from '@mantine/core';
import { Corner } from '@/components/Corner';
import { NoVideoBackground } from './NoVideoBackground';

interface ParticipantTileProps {
  height: number | string;
  width: number | string;
  name: string;
  isVideoOn: boolean;
  children: React.ReactNode;
}

export function ParticipantTile({
  height,
  width,
  name,
  isVideoOn,
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
      {!isVideoOn && <NoVideoBackground />}

      {children}

      {name && (
        <Corner position="bottom-left" yOffset={15} xOffset={15}>
          <Text size="sm" c="white" style={{ userSelect: 'none' }}>
            {name}
          </Text>
        </Corner>
      )}
    </Card>
  );
}
