import { Button, Center, Group, Stack, Title } from '@mantine/core'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(authenticated)/end')({
  beforeLoad: () => {
    const allowed = sessionStorage.getItem('fromInterview') === '1'
    // if you didn't come from interview, then redirect to /
    if (!allowed) {
      throw redirect({ to: '/', replace: true })
    }

    sessionStorage.removeItem('fromInterview')
  },
  component: EndScreen,
})

function EndScreen() {
  return (
    <Center h="100vh">
      <Stack align="center" gap="xl">
        <Title ta="center" px="lg">Thanks for attending the interview</Title>
        <Group>
          <Button>Rejoin</Button>
          <Button component={Link} to="/">
            Go to Dashboard
          </Button>
        </Group>
      </Stack>
    </Center>
  )
}
