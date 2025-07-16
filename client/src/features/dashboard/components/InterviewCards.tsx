import type { InterviewResponse } from '@webmoti-employ/shared'
import { Center, Stack, Text } from '@mantine/core'
import { InterviewCard } from './InterviewCard'

interface InterviewCardsProps {
  interviews: InterviewResponse[]
}

export function InterviewCards({ interviews }: InterviewCardsProps) {
  if (interviews.length === 0) {
    return (
      <Center mt="md">
        <Stack align="center">
          <Text fw="bolder">No interviews to show</Text>
        </Stack>
      </Center>
    )
  }

  return (
    <Stack pb="xl" w="100%">
      {interviews.map(interview => (
        <InterviewCard interview={interview} key={interview.id} />
      ))}
    </Stack>
  )
}
