import type { NotificationMessage } from '@webmoti-employ/shared'
import { Center, Group, Stack, Text, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconBubbleTextFilled,
  IconClockHour4Filled,
  IconHelpHexagonFilled,
  IconHourglassFilled,
  IconMoodSad,
  IconMoodSmileBeam,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { logger } from '@/utils/logger'
import { useCountdown } from '../hooks/useCountdown'
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

  const { hint, timer, fillerCount, newTopic, countUp } = notification

  const looking = feedback.find(f => f.feedbackType === 'lookingAtInterviewer')?.isActive
  const [emoticonPositive, setEmoticonPositive] = useState<boolean | null>(null)
  const graceTimerRef = useRef<number | null>(null)

  const { countdownSeconds, startCountdown, stopCountdown } = useCountdown()
  const { countupSeconds, startCountup, stopCountup } = useCountup()

  useEffect(() => {
    if (timer) {
      logger.log(`Starting ${timer}s countdown`)
      startCountdown(timer)
      stopCountup()
    }
  }, [timer, startCountdown, stopCountup])

  useEffect(() => {
    if (newTopic && timer === null) {
      logger.log('Stopping timer because null and new topic')
      stopCountdown()
    }
  }, [timer, stopCountdown, newTopic])

  useEffect(() => {
    if (countUp) {
      startCountup()
      stopCountdown()
    }
  }, [startCountup, countUp, stopCountdown])

  useEffect(() => {
    if (newTopic && !countUp) {
      stopCountup()
    }
  }, [newTopic, countUp, stopCountup])

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
          icon={<IconHourglassFilled size={iconSize} />}
          label={String(countdownSeconds)}
          isActive={countdownSeconds > 0}
        />
        <FeedbackIcon
          icon={<IconClockHour4Filled size={iconSize} />}
          label={String(countupSeconds)}
          isActive={countupSeconds > 0}
        />
        <FeedbackIcon
          icon={<IconHelpHexagonFilled size={iconSize} />}
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
