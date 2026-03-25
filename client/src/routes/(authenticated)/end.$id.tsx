import { Button, Card, Center, Group, Stack, Text, ThemeIcon, Title, Transition } from '@mantine/core'
import { useDocumentTitle } from '@mantine/hooks'
import { IconCircleCheck, IconHome, IconVideo } from '@tabler/icons-react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

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
  useDocumentTitle('Done | WebMoti')

  const { id } = Route.useParams()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Center h="100vh">
      <Transition mounted={mounted} transition="fade-up" duration={400}>
        {styles => (
          <Card shadow="md" radius="lg" padding="xl" withBorder w={420} style={styles}>
            <Stack align="center" gap="lg">
              <ThemeIcon size={64} radius="xl" variant="light" color="teal">
                <IconCircleCheck size={36} />
              </ThemeIcon>

              <Stack align="center" gap="xs">
                <Title order={1} size="h2" ta="center">Interview Complete</Title>
                <Text c="dimmed" ta="center">
                  Thanks for attending the interview.
                </Text>
              </Stack>

              <Group mt="sm">
                <Link to="/interview/prejoin/$id" params={{ id }}>
                  <Button variant="light" leftSection={<IconVideo size={18} />}>
                    Rejoin
                  </Button>
                </Link>

                <Link to="/">
                  <Button leftSection={<IconHome size={18} />}>
                    Go to Dashboard
                  </Button>
                </Link>
              </Group>
            </Stack>
          </Card>
        )}
      </Transition>
    </Center>
  )
}
