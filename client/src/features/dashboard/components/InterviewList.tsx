import { Center, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { useInterviews } from '../queries'
import { InterviewCards } from './InterviewCards'
import { InterviewCardSkeleton } from './InterviewCardSkeleton'
import { TimeTabs } from './TimeTabs'

export function InterviewList() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const { interviews, isPending, error } = useInterviews()

  const now = new Date()
  const filtered
    = interviews?.filter(i =>
      tab === 'upcoming' ? new Date(i.endTime) > now : new Date(i.endTime) <= now,
    ) || []

  if (isPending) {
    return (
      <Stack>
        {Array.from({ length: 3 }).map((_, idx) => (
          // eslint-disable-next-line react/no-array-index-key
          <InterviewCardSkeleton key={idx} />
        ))}
      </Stack>
    )
  }

  if (error) {
    return (
      <Center>
        <Stack>
          <Text fw="bolder">Error fetching interviews:</Text>
          <Text fw="bolder">{error.message}</Text>
        </Stack>
      </Center>
    )
  }

  if (!interviews || interviews.length === 0) {
    return (
      <Center>
        <Text fw="bolder">You have no scheduled interviews</Text>
      </Center>
    )
  }

  return (
    <>
      <TimeTabs value={tab} onChange={v => v && setTab(v as 'upcoming' | 'past')} />
      <InterviewCards interviews={filtered} />
    </>
  )
}
