import { useUser } from '@clerk/clerk-react'
import { Avatar, Box, Center } from '@mantine/core'

export function NoVideoBackground() {
  const user = useUser()
  const imageUrl = user.user?.imageUrl

  return (
    <>
      <Box
        pos="absolute"
        w="100%"
        h="100%"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(100px)',
        }}
      />
      <Center pos="absolute" w="100%" h="100%">
        <Avatar
          src={imageUrl}
          style={{
            height: 'clamp(50px, 25%, 150px)',
            width: 'auto',
            aspectRatio: '1 / 1',
          }}
        />
      </Center>
    </>
  )
}
