import { Center, Stack, Text } from '@mantine/core'
import { DateTime } from 'luxon'
import { useState } from 'react'
import { useInterviews } from '../queries'
import { InterviewCards } from './InterviewCards'
import { InterviewCardSkeleton } from './InterviewCardSkeleton'
import { TimeTabs } from './TimeTabs'

export function InterviewList() {
  const [tab, setTab] = useState<'upcoming' | 'today' | 'past'>('today')

  const { interviews, isPending, error } = useInterviews()

  const now = DateTime.local()

  const filtered = interviews?.filter((i) => {
    const start = DateTime.fromJSDate(i.startTime).setZone('local')
    const end = i.endTime ? DateTime.fromJSDate(i.endTime).setZone('local') : undefined

    if (tab === 'today') {
      return start.hasSame(now, 'day')
    }
    if (tab === 'upcoming') {
      return end ? end > now && !start.hasSame(now, 'day') : false
    }
    return end ? end <= now && !start.hasSame(now, 'day') : false
  }) || []

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
