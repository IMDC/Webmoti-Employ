import { Center, Loader } from '@mantine/core'

export function Loading() {
  return (
    <Center h="100vh">
      <Loader type="dots" />
    </Center>
  )
}
