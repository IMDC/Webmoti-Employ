import type { DbInterview } from '@web-employ/shared'
import { Avatar, Badge, Button, Card, Divider, Group, Text } from '@mantine/core'
import { IconCalendarEventFilled, IconVideoFilled } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { MyCopyButton } from '@/components/MyCopyButton'
import { UserList } from '@/components/UserList'

interface InterviewCardProps {
  interview: DbInterview
}

export function InterviewCard({ interview }: InterviewCardProps) {
  const navigate = useNavigate()

  const isEnded = interview.endTime < new Date()

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
        <Button
          onClick={() => navigate({ to: '/interview/prejoin/$id', params: { id: interview.sessionId } })}
          disabled={isEnded}
          leftSection={<IconVideoFilled />}
        >
          Join
        </Button>
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
