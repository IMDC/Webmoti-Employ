import type { Interview } from '@web-employ/shared'
import { Avatar, Badge, Button, Card, Divider, Group, Text } from '@mantine/core'
import { IconCalendarEventFilled, IconVideoFilled } from '@tabler/icons-react'
import { MyCopyButton } from '@/components/MyCopyButton'
import { UserList } from '@/components/UserList'

interface InterviewCardProps {
  interview: Interview
}

export function InterviewCard({ interview }: InterviewCardProps) {
  return (
    <Card key={interview.id} shadow="sm" padding="sm" withBorder>
      <Group justify="space-between">
        <Group>
          <Badge
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
            leftSection={<IconCalendarEventFilled size={12} />}
          >
            {formatInterviewTime(interview.startTime)}
          </Badge>
          <Badge>Interviewer</Badge>
        </Group>
        <UserList users={interview.invites ?? []} />
      </Group>

      <Group justify="space-between" mt="sm">
        <Group>
          <Avatar />
          <Text fw="bolder">Interview with Joe</Text>
        </Group>
        <Button leftSection={<IconVideoFilled />}>Join</Button>
      </Group>

      <Divider my="sm" />
      <Group justify="space-between" align="center">
        <Text size="xs" ff="monospace" c="dimmed">
          Session:
          {' '}
          {interview.sessionId}
        </Text>
        <MyCopyButton copyText={interview.sessionId} />
      </Group>
    </Card>
  )
}

function formatInterviewTime(startTime: Date) {
  const start = new Date(startTime)
  const date = start.toLocaleDateString('en-US', { dateStyle: 'medium' })
  const time = start.toLocaleTimeString('en-US', { timeStyle: 'short' })
  return `${date} | ${time}`
}
