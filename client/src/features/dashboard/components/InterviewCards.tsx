import { IconCalendarEventFilled, IconVideoFilled } from '@tabler/icons-react';
import { Avatar, Badge, Button, Card, Center, Group, ScrollArea, Stack, Text } from '@mantine/core';
import { Interview } from '../schema';

interface InterviewCardsProps {
  interviews: Interview[];
}

export function InterviewCards({ interviews }: InterviewCardsProps) {
  if (interviews.length === 0) {
    return (
      <Center mt="md">
        <Stack align="center">
          <Text fw="bolder">No interviews to show</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <ScrollArea>
      <Stack>
        {interviews.map((interview) => (
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
        ))}
      </Stack>
    </ScrollArea>
  );
}

function formatInterviewTime(startTime: Date) {
  const start = new Date(startTime);
  const date = start.toLocaleDateString('en-US', { dateStyle: 'medium' });
  const time = start.toLocaleTimeString('en-US', { timeStyle: 'short' });
  return `${date} | ${time}`;
}
