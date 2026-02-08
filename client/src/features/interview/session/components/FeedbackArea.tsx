import type { NotificationMessage } from '@webmoti-employ/shared'
import { Center, Group, Stack, Text, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconBubbleTextFilled,
  IconClockHour4Filled,
  IconMoodSad,
  IconMoodSmileBeam,
  IconStepInto,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { logger } from '@/utils/logger'
import { useCountup } from '../hooks/useCountup'
import { useFeedback } from '../hooks/useFeedback'

interface FeedbackAreaProps {
  notification: NotificationMessage
  onLookingChange?: (looking: boolean) => void
}

export function FeedbackArea({ notification, onLookingChange }: FeedbackAreaProps) {
  const theme = useMantineTheme()
  const isXL = useMediaQuery(`(min-width: ${theme.breakpoints.xl})`)
  const iconSize = isXL ? 48 : 24

  const feedback = useFeedback()

  const { hint, isQuestion, fillerCount, newTopic } = notification

  const looking = feedback.find(f => f.feedbackType === 'lookingAtInterviewer')?.isActive
  const [emoticonPositive, setEmoticonPositive] = useState<boolean | null>(null)
  const graceTimerRef = useRef<number | null>(null)

  const { countupSeconds, startCountup, stopCountup } = useCountup()

  // start countup if notification is a question
  useEffect(() => {
    if (isQuestion) {
      logger.log('Starting countup for question')
      startCountup()
    }
    else {
      stopCountup()
    }
  }, [isQuestion, startCountup, stopCountup])

  useEffect(() => {
    if (newTopic && !isQuestion) {
      stopCountup()
    }
  }, [newTopic, isQuestion, stopCountup])

  useEffect(() => {
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current)
      graceTimerRef.current = null
    }
    if (looking == null) {
      return
    }
    if (looking) {
      setEmoticonPositive(true)
      onLookingChange?.(true)
      return
    }
    graceTimerRef.current = window.setTimeout(() => {
      setEmoticonPositive(false)
      onLookingChange?.(false)
    }, 2000)

    return () => {
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current)
        graceTimerRef.current = null
      }
    }
  }, [looking, onLookingChange])

  return (
    <Center h="100%">
      <Group gap={70}>
        <FeedbackIcon
          icon={<IconMoodSmileBeam size={iconSize} />}
          label="Eye Contact"
          isActive={emoticonPositive === true}
        />
        <FeedbackIcon
          icon={<IconMoodSad size={iconSize} />}
          label="Look at Interviewer"
          isActive={emoticonPositive === false}
        />
        <FeedbackIcon
          icon={<IconClockHour4Filled size={iconSize} />}
          label={`${countupSeconds}s`}
          isActive={countupSeconds > 0}
        />
        <FeedbackIcon
          icon={<IconStepInto size={iconSize} />}
          label={hint.join(', ')}
          isActive={hint.length > 0}
        />
        <FeedbackIcon
          icon={<IconBubbleTextFilled size={iconSize} />}
          label={`${fillerCount} Filler Word${fillerCount === 1 ? '' : 's'}`}
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
      <Text fz={{ base: 'sm', xl: 'lg' }} c="dimmed" fw="bold">{label}</Text>
    </Stack>
  )
}
