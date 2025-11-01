import type { NotificationMessage } from '@webmoti-employ/shared'
import { Center, Group, Stack, Text, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconBubbleTextFilled,
  IconClockHour4Filled,
  IconEyeCheck,
  IconHelpHexagonFilled,
  IconHourglassFilled,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { logger } from '@/utils/logger'
import { useCountdown } from '../hooks/useCountdown'
import { useCountup } from '../hooks/useCountup'
import { useFeedback } from '../hooks/useFeedback'
import { useGazeStats } from '../hooks/useGazeStats'

interface FeedbackAreaProps {
  notification: NotificationMessage
}

export function FeedbackArea({ notification }: FeedbackAreaProps) {
  const theme = useMantineTheme()
  const isXL = useMediaQuery(`(min-width: ${theme.breakpoints.xl})`)
  const iconSize = isXL ? 48 : 24

  const feedback = useFeedback()

  const { hint, timer, fillerCount, newTopic, countUp } = notification

  const looking = feedback.find(f => f.feedbackType === 'lookingAtInterviewer')?.isActive
  const [showLookPrompt, setShowLookPrompt] = useState(false)
  const fixation = feedback.find(f => f.feedbackType === 'fixation')?.isActive
  const notLookingTimerRef = useRef<number | null>(null)
  const NOT_LOOKING_DELAY_MS = 1200
  const gazeStats = useGazeStats()

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
    if (notLookingTimerRef.current) {
      clearTimeout(notLookingTimerRef.current)
      notLookingTimerRef.current = null
    }
    if (looking || !fixation) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setShowLookPrompt(false)
      return
    }
    notLookingTimerRef.current = window.setTimeout(() => {
      setShowLookPrompt(true)
    }, NOT_LOOKING_DELAY_MS)

    return () => {
      if (notLookingTimerRef.current) {
        clearTimeout(notLookingTimerRef.current)
        notLookingTimerRef.current = null
      }
    }
  }, [looking, fixation])

  return (
    <Center h="100%">
      <Group gap={70}>
        {gazeStats && (
          <Stack align="center" gap={0}>
            <Text size="xs" fw={500}>
              {Math.round(gazeStats.gazeOnInterviewerRatio * 100)}
              % on interviewer
            </Text>
            <Text size="xs" c="dimmed">
              last
              {gazeStats.windowSeconds}
              s
            </Text>
          </Stack>
        )}
        <FeedbackIcon
          icon={<IconEyeCheck size={iconSize} />}
          label="Look at Interviewer"
          isActive={showLookPrompt}
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
