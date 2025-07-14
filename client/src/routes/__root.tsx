import { Center, Divider, Group, Title } from '@mantine/core'
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
      <Group>
        <Title>404</Title>
        <Divider orientation="vertical" size="lg" />
        <Title>Page Not Found</Title>
      </Group>
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
