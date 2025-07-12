import type { InterviewResponse } from '@web-employ/shared'
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
    <Stack pb="xl" w={{ base: 400, sm: 500, lg: 700 }} mx="auto">
      {interviews.map(interview => (
        <InterviewCard interview={interview} key={interview.id} />
      ))}
    </Stack>
  )
}
