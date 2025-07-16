import { Center, Divider, Group, Stack, Text, Title } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ErrorDialog } from '@/components/ErrorDialog'

export const Route = createRootRoute({
  component: RootRoute,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <Center h="100vh">
      <Stack>
        <Group>
          <Title>404</Title>
          <Divider orientation="vertical" size="lg" />
          <Title>Page Not Found</Title>
        </Group>

        <Text c="dimmed" ta="center">
          {window.location.href}
        </Text>
      </Stack>
    </Center>
  )
}

function RootRoute() {
  return (
    <>
      <Outlet />
      <ErrorDialog />
      <Notifications />
    </>
  )
}
