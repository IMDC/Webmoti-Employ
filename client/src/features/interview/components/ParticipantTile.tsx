import { Card, Skeleton, Text, useMantineTheme } from '@mantine/core'
import { Corner } from '@/components/Corner'
import { NoVideoBackground } from './NoVideoBackground'

interface ParticipantTileProps {
  height: number | string
  width: number | string
  children: React.ReactNode
  name: string
  profileUrl: string
  isLoadingProfiles: boolean
  isActiveSpeaker?: boolean
}

export function ParticipantTile({
  height,
  width,
  name,
  children,
  profileUrl,
  isLoadingProfiles,
  isActiveSpeaker,
}: ParticipantTileProps) {
  const theme = useMantineTheme()

  return (
    <Card
      h={height}
      w="100%"
      maw={width}
      p={0}
      radius="lg"
      pos="relative"
      style={{
        overflow: 'hidden',
        // use box shadow instead of border because border takes up space inside the card
        // and it makes the video slightly smaller
        boxShadow: isActiveSpeaker
          ? `0 0 0 3px ${theme.colors.green[5]}`
          : undefined,
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
            <Text size="sm" c="white">
              {name}
            </Text>
          </Skeleton>
        </Corner>
      )}
    </Card>
  )
}
