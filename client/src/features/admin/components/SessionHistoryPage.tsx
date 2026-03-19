import { Alert, Badge, Center, Group, Loader, Stack, Table, Text, Title, Tooltip } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconMicrophone, IconMovie, IconScreenShare, IconVideo } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { DateTime } from 'luxon'
import { useState } from 'react'
import { useSessionHistory } from '../queries'
import { AdminBurger } from './AdminBurger'

function defaultDateRange(): [string, string] {
  const to = DateTime.now().toFormat('yyyy-MM-dd')
  const from = DateTime.now().minus({ days: 7 }).toFormat('yyyy-MM-dd')
  return [from, to]
}

export function SessionHistoryPage() {
  const [defaults] = useState(defaultDateRange)
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([defaults[0], defaults[1]])

  const from = dateRange[0] ?? defaults[0]
  const to = dateRange[1] ?? defaults[1]

  const { data: sessions, isPending, error } = useSessionHistory(from, to)
  const navigate = useNavigate()

  return (
    <Stack>
      <Group>
        <AdminBurger />
        <Title order={3}>Session History</Title>
      </Group>
      <Text c="dimmed" size="sm">Past Zoom Video SDK sessions.</Text>

      <Group>
        <DatePickerInput
          type="range"
          label="Date range"
          value={dateRange}
          onChange={v => setDateRange(v)}
          maxDate={new Date()}
          clearable={false}
          w={300}
        />
      </Group>

      {error && <Alert color="red">Failed to load session history</Alert>}

      {isPending
        ? <Center h="60vh"><Loader type="dots" /></Center>
        : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Session</Table.Th>
                  <Table.Th>Start</Table.Th>
                  <Table.Th>End</Table.Th>
                  <Table.Th>Duration</Table.Th>
                  <Table.Th>Participants</Table.Th>
                  <Table.Th>Features</Table.Th>
                  <Table.Th>Interview</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sessions?.map(session => (
                  <Table.Tr key={session.id}>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {session.session_key
                          ? `${session.session_key.slice(0, 8)}...`
                          : session.session_name.slice(0, 12)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {DateTime.fromJSDate(session.start_time).toLocaleString(DateTime.DATETIME_MED)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {DateTime.fromJSDate(session.end_time).toLocaleString(DateTime.DATETIME_MED)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{session.duration}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light">
                        {session.user_count}
                        {' '}
                        {session.user_count === 1 ? 'user' : 'users'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        {session.has_voip && <Tooltip label="Audio"><IconMicrophone size={16} /></Tooltip>}
                        {session.has_video && <Tooltip label="Video"><IconVideo size={16} /></Tooltip>}
                        {session.has_screen_share && <Tooltip label="Screen Share"><IconScreenShare size={16} /></Tooltip>}
                        {session.has_recording && <Tooltip label="Recording"><IconMovie size={16} /></Tooltip>}
                      </Group>
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
                    <Table.Td colSpan={7}>
                      <Text c="dimmed" ta="center">No sessions found in this date range</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}
    </Stack>
  )
}
