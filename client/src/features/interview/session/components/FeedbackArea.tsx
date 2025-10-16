import type { NotificationMessage } from '@webmoti-employ/shared'
import { Center, Group, Stack, Text } from '@mantine/core'
import {
  IconBubbleTextFilled,
  IconClockHour4Filled,
  IconEyeCheck,
  IconHelpHexagonFilled,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { useFeedback } from '../hooks/useFeedback'

interface FeedbackAreaProps {
  notification: NotificationMessage
}

export function FeedbackArea({ notification }: FeedbackAreaProps) {
  const feedback = useFeedback()

  const { detail, timer, fillerCount } = notification

  const looking = feedback.find(f => f.feedbackType === 'lookingAtInterviewer')?.isActive

  const [currentTimer, setCurrentTimer] = useState<number | null>(timer ?? null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (notification.timer == null) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setCurrentTimer(null)
      return
    }

    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setCurrentTimer(notification.timer)
    intervalRef.current = window.setInterval(() => {
      setCurrentTimer((prev) => {
        if (prev == null || prev <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [notification])

  return (
    <Center h="100%">
      <Group gap={70}>
        <FeedbackIcon
          icon={<IconEyeCheck size={24} />}
          label="Look at Interviewer"
          isActive={!!looking}
        />
        <FeedbackIcon
          icon={<IconClockHour4Filled size={24} />}
          label={currentTimer != null ? String(currentTimer) : ''}
          isActive={currentTimer != null && currentTimer > 0}
        />
        <FeedbackIcon
          icon={<IconHelpHexagonFilled size={24} />}
          label="More Detail"
          isActive={detail === false}
        />
        <FeedbackIcon
          icon={<IconBubbleTextFilled size={24} />}
          label={`${fillerCount} Filler Words`}
          isActive={fillerCount != null && fillerCount > 0}
        />
      </Group>
    </Center>
  )
}

function FeedbackIcon({ icon, label, isActive }: {
  icon: React.ReactNode
  label: string
  isActive: boolean
}) {
  if (!isActive) {
    return null
  }

  return (
    <Stack align="center" gap={0}>
      {icon}
      <Text size="xs" c="dimmed">{label}</Text>
    </Stack>
  )
}
