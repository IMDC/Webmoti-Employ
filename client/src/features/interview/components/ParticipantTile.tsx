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
      w="100%"
      maw={width}
      p={0}
      radius="lg"
      pos="relative"
      style={{ overflow: 'hidden' }}
    >
      <NoVideoBackground
        profileUrl={profileUrl}
        isLoadingProfiles={isLoadingProfiles}
      />

      {children}

      {name && (
        <Corner position="bottom-left" yOffset={15} xOffset={15}>
          <Skeleton visible={isLoadingProfiles}>
            <Text size="sm" c="white">
              {name}
            </Text>
          </Skeleton>
        </Corner>
      )}
    </Card>
  )
}
