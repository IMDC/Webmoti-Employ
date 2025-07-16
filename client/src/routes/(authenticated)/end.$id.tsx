import { Button, Center, Group, Stack, Title } from '@mantine/core'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(authenticated)/end/$id')({
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
  const { id } = Route.useParams()

  return (
    <Center h="100vh">
      <Stack align="center" gap="xl">
        <Title ta="center" px="lg">Thanks for attending the interview</Title>
        <Group>
          <Link to="/interview/prejoin/$id" params={{ id }}>
            <Button>Rejoin</Button>
          </Link>

          <Link to="/">
            <Button>Go to Dashboard</Button>
          </Link>
        </Group>
      </Stack>
    </Center>
  )
}
