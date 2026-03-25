import type { ScheduleData } from '@/components/ScheduleForm'
import { Alert, Center, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { useDocumentTitle } from '@mantine/hooks'
import { ScheduleForm } from '@/components/ScheduleForm'
import { notifySuccess } from '@/utils/utils'
import { useAdminScheduleInterview, useAdminUsers } from '../queries'
import { AdminBurger } from './AdminBurger'

export function AdminSchedulePage() {
  useDocumentTitle('Admin | WebMoti')

  const { data: users, isPending: usersLoading, error: usersError } = useAdminUsers()
  const scheduleMutation = useAdminScheduleInterview()

  async function handleSchedule(data: ScheduleData) {
    return scheduleMutation.mutateAsync({
      hostId: data.hostId,
      startTime: data.startTime,
      endTime: data.endTime,
      isInstant: false,
      invites: data.invites,
    })
  }

  function handleSuccess() {
    notifySuccess('Interview scheduled', 'The interview has been created.')
  }

  if (usersError) {
    return (
      <Stack maw={600}>
        <Group>
          <AdminBurger />
          <Title order={3}>Schedule Interview</Title>
        </Group>
        <Alert color="red">Failed to load users</Alert>
      </Stack>
    )
  }

  if (usersLoading) {
    return (
      <Stack maw={600}>
        <Group>
          <AdminBurger />
          <Title order={3}>Schedule Interview</Title>
        </Group>
        <Text c="dimmed" size="sm">Schedule an interview between users. You will not be added as a participant.</Text>
        <Center h="40vh"><Loader type="dots" /></Center>
      </Stack>
    )
  }

  const hostOptions = (users ?? []).map(u => ({
    value: u.id,
    label: `${u.name} (${u.email})`,
  }))

  const inviteEmailOptions = (users ?? []).map(u => u.email)

  return (
    <Stack maw={600}>
      <Group>
        <AdminBurger />
        <Title order={3}>Schedule Interview</Title>
      </Group>
      <Text c="dimmed" size="sm">Schedule an interview between users. You will not be added as a participant.</Text>

      <ScheduleForm
        hostOptions={hostOptions}
        inviteEmailOptions={inviteEmailOptions}
        onSchedule={handleSchedule}
        isPending={scheduleMutation.isPending}
        onSuccess={handleSuccess}
      />
    </Stack>
  )
}
