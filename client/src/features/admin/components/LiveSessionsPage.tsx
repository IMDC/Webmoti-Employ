import { Alert, Badge, Center, Group, Loader, Stack, Table, Text, Title } from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { DateTime } from 'luxon'
import { useLiveSessions } from '../queries'
import { AdminBurger } from './AdminBurger'

export function LiveSessionsPage() {
  const { data: sessions, isPending, error } = useLiveSessions()
  const navigate = useNavigate()

  if (error) {
    return <Alert color="red">Failed to load live sessions</Alert>
  }

  return (
    <Stack>
      <Group>
        <AdminBurger />
        <Title order={3}>Live Sessions</Title>
        <Badge size="sm" variant="dot" color="green">Auto-refreshing</Badge>
      </Group>
      <Text c="dimmed" size="sm">Currently active interview sessions.</Text>

      {isPending
        ? <Center h="60vh"><Loader type="dots" /></Center>
        : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Session</Table.Th>
                  <Table.Th>Started</Table.Th>
                  <Table.Th>Duration</Table.Th>
                  <Table.Th>Participants</Table.Th>
                  <Table.Th>Interview</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sessions?.map(session => (
                  <Table.Tr key={session.id}>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {session.session_name.slice(0, 8)}
                        ...
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {DateTime.fromJSDate(session.start_time).toLocaleString(DateTime.DATETIME_MED)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {DateTime.fromJSDate(session.start_time).toRelative({ style: 'short' })}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light">
                        {session.user_count}
                        {' '}
                        {session.user_count === 1 ? 'user' : 'users'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {session.interviewId
                        ? (
                            <Badge
                              size="sm"
                              variant="outline"
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate({ to: '/admin/interviews', search: { highlight: session.interviewId! } })}
                            >
                              #
                              {session.interviewId}
                            </Badge>
                          )
                        : (
                            <Text size="sm" c="dimmed">N/A</Text>
                          )}
                    </Table.Td>
                  </Table.Tr>
                ))}
                {sessions?.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text c="dimmed" ta="center">No active sessions</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}
    </Stack>
  )
}
