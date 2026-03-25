import { Center, Loader } from '@mantine/core'

export function Loading() {
  return (
    <Center h="100vh" role="status" aria-label="Loading">
      <Loader type="dots" />
    </Center>
  )
}
