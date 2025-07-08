import { IconCalendarEventFilled, IconVideoFilled } from '@tabler/icons-react';
import { Avatar, Badge, Button, Card, Group, Text } from '@mantine/core';
import { Interview } from '../schema';

interface InterviewCardProps {
  interview: Interview;
}

export function InterviewCard({ interview }: InterviewCardProps) {
  return (
    <Card key={interview.id} shadow="sm" padding="sm" withBorder>
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

      <Group justify="space-between" mt="sm">
        <Group>
          <Avatar />
          <Text fw="bolder">Interview with Joe</Text>
        </Group>
        <Button leftSection={<IconVideoFilled />}>Join</Button>
      </Group>
    </Card>
  );
}

function formatInterviewTime(startTime: Date) {
  const start = new Date(startTime);
  const date = start.toLocaleDateString('en-US', { dateStyle: 'medium' });
  const time = start.toLocaleTimeString('en-US', { timeStyle: 'short' });
  return `${date} | ${time}`;
}
