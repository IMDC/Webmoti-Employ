import { Avatar, Box, Center, Skeleton } from '@mantine/core'

interface NoVideoBackgroundProps {
  profileUrl: string
  isLoadingProfiles: boolean
}

export function NoVideoBackground({ profileUrl, isLoadingProfiles }: NoVideoBackgroundProps) {
  return (
    <>
      <Box
        pos="absolute"
        w="100%"
        h="100%"
        style={{
          backgroundImage: `url(${profileUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(100px)',
        }}
      />
      <Center pos="absolute" w="100%" h="100%">
        {!isLoadingProfiles
          ? (
              <Avatar
                src={profileUrl}
                style={{
                  height: 'clamp(50px, 25%, 150px)',
                  width: 'auto',
                  aspectRatio: '1 / 1',
                }}
              />
            )
          : (
              <Skeleton
                circle
                style={{
                  height: 'clamp(50px, 25%, 150px)',
                  width: 'auto',
                  aspectRatio: '1 / 1',
                }}
              />
            )}
      </Center>
    </>
  )
}
