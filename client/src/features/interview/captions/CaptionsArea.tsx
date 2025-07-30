import { Avatar, Flex, Group, ScrollArea, Space, Stack, Text } from '@mantine/core'
import { useEffect, useRef } from 'react'
import { useUser } from '@/features/auth/hooks/useUserStore'

function Caption() {
  const user = useUser()

  return (
    <Group>
      <Avatar src={user.image} />

      <Stack gap={0}>
        <Text>You</Text>

        <Text>Example caption</Text>
      </Stack>
    </Group>
  )
}

export function CaptionsArea() {
  const scrollViewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollViewportRef.current
    if (!el) {
      return
    }
    el.scrollTo({ top: el.scrollHeight, behavior: 'instant' })
  }, [])

  return (
    // TODO use react-virtual
    <ScrollArea
      viewportRef={scrollViewportRef}
      h="100%"
      px={{ base: 10, sm: 100 }}
      offsetScrollbars
    >
      <Flex
        h="100%"
        justify="flex-end"
        direction="column"
        gap="sm"
      >
        <Space h="xl" />
        <Space h="xl" />
        <Caption />
        <Caption />
      </Flex>
    </ScrollArea>
  )
}
