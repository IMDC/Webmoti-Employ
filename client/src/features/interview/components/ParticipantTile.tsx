import { Card, Text } from '@mantine/core'
import { Corner } from '@/components/Corner'
import { NoVideoBackground } from './NoVideoBackground'

interface ParticipantTileProps {
  height: number | string
  width: number | string
  children: React.ReactNode
  name: string
  profileUrl: string
}

export function ParticipantTile({
  height,
  width,
  name,
  children,
  profileUrl,
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
      <NoVideoBackground profileUrl={profileUrl} />

      {children}

      {name && (
        <Corner position="bottom-left" yOffset={15} xOffset={15}>
          <Text size="sm" c="white" style={{ userSelect: 'none' }}>
            {name}
          </Text>
        </Corner>
      )}
    </Card>
  )
}
