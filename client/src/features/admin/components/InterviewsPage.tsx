import {
  ActionIcon,
  Alert,
  Badge,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { DateTime } from 'luxon'
import { notifyError } from '@/utils/utils'
import { useAdminDeleteInterview, useAdminInterviews } from '../queries'

export function InterviewsPage() {
  const { data: interviews, isPending, error } = useAdminInterviews()
  const deleteMutation = useAdminDeleteInterview()

  async function handleDelete(id: number) {
    try {
      await deleteMutation.mutateAsync(id)
    }
    catch (err) {
      notifyError('Failed to delete interview', err)
    }
  }

  if (error) {
    return <Alert color="red">Failed to load interviews</Alert>
  }

  return (
    <Stack>
      <Title order={3}>Interviews</Title>
      <Text c="dimmed" size="sm">All scheduled and instant interviews.</Text>

      {isPending
        ? <Loader />
        : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Start Time</Table.Th>
                  <Table.Th>Participants</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {interviews?.map(interview => (
                  <Table.Tr key={interview.id}>
                    <Table.Td>
                      <Text size="sm" ff="monospace">{interview.id}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light" color={interview.isInstant ? 'orange' : 'blue'}>
                        {interview.isInstant ? 'Instant' : 'Scheduled'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {DateTime.fromJSDate(interview.startTime).toLocaleString(DateTime.DATETIME_MED)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        {interview.invites.map(invite => (
                          <Badge key={invite.id} size="xs" variant="outline">
                            {invite.email.split('@')[0]}
                          </Badge>
                        ))}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          loading={deleteMutation.isPending}
                          onClick={() => handleDelete(interview.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {interviews?.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text c="dimmed" ta="center">No interviews found</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}
    </Stack>
  )
}
