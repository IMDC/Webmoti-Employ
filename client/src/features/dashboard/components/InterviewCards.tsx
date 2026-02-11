import type { InterviewResponse } from '@webmoti-employ/shared'
import { Center, Pagination, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { InterviewCard } from './InterviewCard'

interface InterviewCardsProps {
  interviews: InterviewResponse[]
  pageSize?: number
}

export function InterviewCards({ interviews, pageSize = 5 }: InterviewCardsProps) {
  const [activePage, setActivePage] = useState(1)

  if (interviews.length === 0) {
    return (
      <Center mt="md">
        <Stack align="center">
          <Text fw="bolder">No interviews to show</Text>
        </Stack>
      </Center>
    )
  }

  const totalPages = Math.ceil(interviews.length / pageSize)
  const start = (activePage - 1) * pageSize
  const end = start + pageSize
  const pageItems = interviews.slice(start, end)

  return (
    <Stack pb="xl" w="100%">
      {pageItems.map(interview => (
        <InterviewCard key={interview.id} interview={interview} />
      ))}
      {totalPages > 1 && (
        <Pagination
          total={totalPages}
          value={activePage}
          onChange={setActivePage}
          mt="sm"
        />
      )}
    </Stack>
  )
}
