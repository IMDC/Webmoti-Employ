import { IconCalendarEventFilled, IconVideoFilled } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod/v4';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Center,
  Group,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import { InterviewsResponseSchema } from './schema';

async function getInterviews() {
  const response = await fetch('/api/interviews');
  const json = await response.json();

  const result = InterviewsResponseSchema.safeParse(json);
  if (!result.success) {
    throw new Error(z.prettifyError(result.error));
  }

  return result.data.interviews;
}

function formatInterviewTime(startTime: Date, endTime: Date) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const date = start.toLocaleDateString('en-US', { dateStyle: 'medium' });
  const startTimeStr = start.toLocaleTimeString('en-US', { timeStyle: 'short' });
  const endTimeStr = end.toLocaleTimeString('en-US', { timeStyle: 'short' });

  return `${date}, ${startTimeStr} to ${endTimeStr}`;
}

export function InterviewList() {
  const {
    data: interviews,
    isPending,
    error,
  } = useQuery({
    queryKey: ['interviews'],
    queryFn: getInterviews,
  });

  if (isPending) {
    return (
      <>
        <Skeleton height={60} />
        <Skeleton height={60} />
        <Skeleton height={60} />
      </>
    );
  }

  if (error) {
    return (
      <Center>
        <Stack>
          <Text fw="bolder">Error fetching interviews:</Text>
          <Text fw="bolder">{error.message}</Text>
        </Stack>
      </Center>
    );
  }

  if (!interviews) {
    return (
      <Center>
        <Text fw="bolder">You have no scheduled interviews</Text>
      </Center>
    );
  }

  return (
    <ScrollArea>
      {interviews.map((interview) => (
        <Card key={interview.id} shadow="sm" padding="sm" withBorder>
          <Group>
            <Badge
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
              leftSection={<IconCalendarEventFilled size={12} />}
            >
              {formatInterviewTime(interview.startTime, interview.endTime)}
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
    </ScrollArea>
  );
}
