import { AppShell, Center, Divider, Group, Stack, Text, Title, useMantineTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ElectronToolbar } from '@/components/ElectronToolbar'
import { useElectronLogs } from '@/features/interview/session/hooks/useElectronLogs'
import { OUTER_TOOLBAR_HEIGHT } from '@/utils/constants'
import { isElectron } from '@/utils/utils'

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
  useElectronLogs()
  const theme = useMantineTheme()

  return (
    <>
      <AppShell
        header={{ height: isElectron() ? OUTER_TOOLBAR_HEIGHT : 0 }}
        styles={{
          header: {
            border: 'none',
            backgroundColor: theme.colors.gray[9],
          },
          // remove default padding from main
          main: { padding: 0 },
        }}
      >
        {isElectron() && (
          <AppShell.Header>
            <ElectronToolbar />
          </AppShell.Header>
        )}

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>

      <Notifications />
    </>
  )
}
