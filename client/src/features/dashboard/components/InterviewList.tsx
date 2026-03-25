import { Center, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconCalendarOff, IconExclamationCircle } from '@tabler/icons-react'
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
      <Center mt="xl">
        <Stack align="center" gap="xs">
          <ThemeIcon size={48} radius="xl" variant="light" color="red">
            <IconExclamationCircle size={24} />
          </ThemeIcon>
          <Text fw="bolder">Error fetching interviews</Text>
          <Text c="dimmed" size="sm">{error.message}</Text>
        </Stack>
      </Center>
    )
  }

  if (!interviews || interviews.length === 0) {
    return (
      <Center mt="xl">
        <Stack align="center" gap="xs">
          <ThemeIcon size={48} radius="xl" variant="light" color="gray">
            <IconCalendarOff size={24} />
          </ThemeIcon>
          <Text fw="bolder">No scheduled interviews</Text>
          <Text c="dimmed" size="sm">Create a new interview to get started.</Text>
        </Stack>
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
