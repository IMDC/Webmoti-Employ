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
        bgp="center"
        bgsz="cover"
        style={{
          backgroundImage: `url(${profileUrl})`,
          filter: 'blur(100px)',
        }}
      />
      <Center pos="absolute" w="100%" h="100%">
        {!isLoadingProfiles
          ? <Avatar src={profileUrl} w="15%" h="auto" draggable={false} />
          : <Skeleton circle w="15%" h="auto" />}
      </Center>
    </>
  )
}
