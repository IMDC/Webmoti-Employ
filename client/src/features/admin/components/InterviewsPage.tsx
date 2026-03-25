import {
  Alert,
  Badge,
  Center,
  Checkbox,
  Group,
  Loader,
  Pagination,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconCalendarOff } from '@tabler/icons-react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DeleteButton } from '@/components/DeleteButton'
import { notifyError } from '@/utils/utils'
import adminClasses from '../admin.module.css'
import { useAdminDeleteInterview, useAdminInterviews } from '../queries'
import { AdminBurger } from './AdminBurger'

export function InterviewsPage() {
  const { data: interviews, isPending, error } = useAdminInterviews()
  const deleteMutation = useAdminDeleteInterview()
  const navigate = useNavigate()
  const { highlight } = useSearch({ strict: false }) as { highlight?: number }
  const highlightRef = useRef<HTMLTableRowElement>(null)

  const [showInstant, setShowInstant] = useState(false)
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null])
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  useEffect(() => {
    if (highlight && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlight, interviews])

  const filteredInterviews = useMemo(() => {
    if (!interviews)
      return []
    return interviews.filter((interview) => {
      if (!showInstant && interview.isInstant)
        return false
      if (dateRange[0] && interview.startTime < new Date(dateRange[0]))
        return false
      if (dateRange[1]) {
        const endOfDay = new Date(dateRange[1])
        endOfDay.setHours(23, 59, 59, 999)
        if (interview.startTime > endOfDay)
          return false
      }
      return true
    })
  }, [interviews, showInstant, dateRange])

  const totalPages = Math.ceil(filteredInterviews.length / PAGE_SIZE)
  const paginatedInterviews = filteredInterviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await deleteMutation.mutateAsync(id)
    }
    catch (err) {
      notifyError('Failed to delete interview', err)
    }
    finally {
      setDeletingId(null)
    }
  }

  if (error) {
    return <Alert color="red">Failed to load interviews</Alert>
  }

  return (
    <Stack>
      <Group>
        <AdminBurger />
        <Title order={3}>Interviews</Title>
      </Group>
      <Text c="dimmed" size="sm">All scheduled and instant interviews.</Text>

      <Group>
        <Checkbox
          label="Show instant interviews"
          checked={showInstant}
          onChange={(e) => {
            setShowInstant(e.currentTarget.checked)
            setPage(1)
          }}
        />
        <DatePickerInput
          type="range"
          placeholder="Filter by date range"
          value={dateRange}
          onChange={(val) => {
            setDateRange(val)
            setPage(1)
          }}
          clearable
          w={280}
        />
      </Group>

      {isPending
        ? <Center h="60vh"><Loader type="dots" /></Center>
        : (
            <Table.ScrollContainer minWidth={700}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Host</Table.Th>
                    <Table.Th>Start Time</Table.Th>
                    <Table.Th>Participants</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedInterviews.map(interview => (
                    <Table.Tr
                      key={interview.id}
                      ref={highlight === interview.id ? highlightRef : undefined}
                      className={highlight === interview.id ? adminClasses.highlightRow : undefined}
                    >
                      <Table.Td>
                        <Text size="sm" ff="monospace">{interview.id}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" variant="light" color={interview.isInstant ? 'orange' : 'blue'}>
                          {interview.isInstant ? 'Instant' : 'Scheduled'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Tooltip label={interview.hostEmail ?? interview.hostId}>
                          <Badge
                            size="xs"
                            variant="outline"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate({ to: '/admin/users', search: { highlight: interview.hostId } })}
                          >
                            {interview.hostName ?? interview.hostEmail ?? interview.hostId}
                          </Badge>
                        </Tooltip>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {DateTime.fromJSDate(interview.startTime).toLocaleString(DateTime.DATETIME_MED)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          {interview.invites.map(invite => (
                            <Tooltip key={invite.id} label={invite.email}>
                              {invite.userId
                                ? (
                                    <Badge
                                      size="xs"
                                      variant="outline"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => navigate({ to: '/admin/users', search: { highlight: invite.userId! } })}
                                    >
                                      {invite.name ?? invite.email.split('@')[0]}
                                    </Badge>
                                  )
                                : (
                                    <Badge size="xs" variant="outline" color="gray">
                                      {invite.email.split('@')[0]}
                                    </Badge>
                                  )}
                            </Tooltip>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <DeleteButton
                          label="Delete"
                          loading={deletingId === interview.id}
                          onClick={() => handleDelete(interview.id)}
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {filteredInterviews.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Stack align="center" gap="xs" py="md">
                          <ThemeIcon size={40} radius="xl" variant="light" color="gray">
                            <IconCalendarOff size={20} />
                          </ThemeIcon>
                          <Text c="dimmed" ta="center">No interviews found</Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}

      {totalPages > 1 && (
        <Center>
          <Pagination total={totalPages} value={page} onChange={setPage} />
        </Center>
      )}
    </Stack>
  )
}
