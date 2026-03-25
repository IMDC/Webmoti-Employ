import { Box, Center, Skeleton } from '@mantine/core'
import { GoogleAvatar } from '@/components/GoogleAvatar'

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
        style={{ backgroundImage: `url(${profileUrl})`, filter: 'blur(100px)' }}
      />
      <Center pos="absolute" w="100%" h="100%">
        {!isLoadingProfiles
          ? (<GoogleAvatar src={profileUrl} w="15%" h="auto" />)
          : <Skeleton circle w="15%" h="auto" />}
      </Center>
    </>
  )
}
