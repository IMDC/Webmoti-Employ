import type { SessionParticipant } from '../queries'
import { Alert, Badge, Center, Group, Loader, Modal, Pagination, Stack, Table, Text, Title, Tooltip } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import { IconMicrophone, IconMovie, IconScreenShare, IconVideo } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { DateTime } from 'luxon'
import { useState } from 'react'
import { useSessionHistory, useSessionParticipants } from '../queries'
import { AdminBurger } from './AdminBurger'

function defaultDateRange(): [string, string] {
  const to = DateTime.now().toFormat('yyyy-MM-dd')
  const from = DateTime.now().minus({ days: 7 }).toFormat('yyyy-MM-dd')
  return [from, to]
}

function qualityColor(quality: string) {
  switch (quality) {
    case 'good': return 'green'
    case 'fair': return 'yellow'
    case 'poor': return 'orange'
    case 'bad': return 'red'
    default: return 'gray'
  }
}

function ParticipantsTable({ participants }: { participants: SessionParticipant[] }) {
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Device</Table.Th>
          <Table.Th>Joined</Table.Th>
          <Table.Th>Left</Table.Th>
          <Table.Th>Location</Table.Th>
          <Table.Th>Audio</Table.Th>
          <Table.Th>Video</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {participants.map(p => (
          <Table.Tr key={p.id}>
            <Table.Td>
              {p.userName
                ? (
                    <div>
                      <Text size="sm" fw={500}>{p.userName}</Text>
                      <Text size="xs" c="dimmed">{p.userEmail}</Text>
                    </div>
                  )
                : <Text size="sm" c="dimmed">{p.name || p.user_key || 'Unknown'}</Text>}
            </Table.Td>
            <Table.Td><Text size="sm">{p.device || '-'}</Text></Table.Td>
            <Table.Td>
              <Text size="sm">{DateTime.fromJSDate(p.join_time).toLocaleString(DateTime.TIME_SIMPLE)}</Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{DateTime.fromJSDate(p.leave_time).toLocaleString(DateTime.TIME_SIMPLE)}</Text>
            </Table.Td>
            <Table.Td><Text size="sm">{p.location || '-'}</Text></Table.Td>
            <Table.Td>
              {p.audio_quality
                ? <Badge size="xs" color={qualityColor(p.audio_quality)}>{p.audio_quality}</Badge>
                : <Text size="sm" c="dimmed">-</Text>}
            </Table.Td>
            <Table.Td>
              {p.video_quality
                ? <Badge size="xs" color={qualityColor(p.video_quality)}>{p.video_quality}</Badge>
                : <Text size="sm" c="dimmed">-</Text>}
            </Table.Td>
          </Table.Tr>
        ))}
        {participants.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={7}>
              <Text c="dimmed" ta="center">No participant data available</Text>
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  )
}

export function SessionHistoryPage() {
  const [defaults] = useState(defaultDateRange)
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([defaults[0], defaults[1]])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const from = dateRange[0] ?? defaults[0]
  const to = dateRange[1] ?? defaults[1]

  const { data: sessions, isPending, error } = useSessionHistory(from, to)
  const { data: participants, isPending: participantsLoading } = useSessionParticipants(selectedSessionId)
  const navigate = useNavigate()

  const totalPages = Math.ceil((sessions?.length ?? 0) / PAGE_SIZE)
  const paginatedSessions = sessions?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleRowClick(sessionId: string) {
    setSelectedSessionId(sessionId)
    openModal()
  }

  return (
    <Stack>
      <Group>
        <AdminBurger />
        <Title order={3}>Session History</Title>
      </Group>
      <Text c="dimmed" size="sm">Past Zoom Video SDK sessions. Click a row to view participants.</Text>

      <Group>
        <DatePickerInput
          type="range"
          label="Date range"
          value={dateRange}
          onChange={(v) => {
            setDateRange(v)
            setPage(1)
          }}
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
                {paginatedSessions?.map(session => (
                  <Table.Tr key={session.id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(session.id)}>
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
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate({ to: '/admin/interviews', search: { highlight: session.interviewId! } })
                              }}
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

      {totalPages > 1 && (
        <Center>
          <Pagination total={totalPages} value={page} onChange={setPage} />
        </Center>
      )}

      <Modal opened={modalOpened} onClose={closeModal} title="Session Participants" size="xl">
        {participantsLoading
          ? <Center py="xl"><Loader type="dots" /></Center>
          : participants && <ParticipantsTable participants={participants} />}
      </Modal>
    </Stack>
  )
}
