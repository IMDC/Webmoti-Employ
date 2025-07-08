import { Center, ScrollArea, Stack, Text } from '@mantine/core';
import { Interview } from '../schema';
import { InterviewCard } from './InterviewCard';

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
        {interviews.map((interview, index) => (
          <InterviewCard interview={interview} key={index} />
        ))}
      </Stack>
    </ScrollArea>
  );
}
