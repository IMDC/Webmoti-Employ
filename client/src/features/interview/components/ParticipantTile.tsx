import { Card, Skeleton, Text } from '@mantine/core'
import { Corner } from '@/components/Corner'
import { NoVideoBackground } from './NoVideoBackground'

interface ParticipantTileProps {
  height: number | string
  width: number | string
  children: React.ReactNode
  name: string
  profileUrl: string
  isLoadingProfiles: boolean
}

export function ParticipantTile({
  height,
  width,
  name,
  children,
  profileUrl,
  isLoadingProfiles,
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
      <NoVideoBackground
        profileUrl={profileUrl}
        isLoadingProfiles={isLoadingProfiles}
      />

      {children}

      {name && (
        <Corner position="bottom-left" yOffset={15} xOffset={15}>
          <Skeleton visible={isLoadingProfiles}>
            <Text size="sm" c="white" style={{ userSelect: 'none' }}>
              {name}
            </Text>
          </Skeleton>
        </Corner>
      )}
    </Card>
  )
}
