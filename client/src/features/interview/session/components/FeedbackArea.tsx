import type { NotificationMessage } from '@webmoti-employ/shared'
import { Center, Group, Stack, Text, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconAlertTriangleFilled,
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

  const { hint, isQuestion, fillerCount, wordCount, newTopic, offTopic } = notification

  // fillerCount and wordCount are already accumulated per topic in useAiWebsocket.
  // Only show the warning after enough words and if filler % exceeds threshold.
  const FILLER_MIN_WORDS = 10
  const FILLER_THRESHOLD = 0.08
  const showFillerWarning = wordCount >= FILLER_MIN_WORDS
    && fillerCount / wordCount >= FILLER_THRESHOLD

  useEffect(() => {
    logger.log('[FeedbackArea] filler tracking:', {
      fillerCount,
      wordCount,
      pct: wordCount > 0
        ? `${(fillerCount / wordCount * 100).toFixed(1)}%`
        : '0%',
      showFillerWarning,
    })
  }, [fillerCount, wordCount, showFillerWarning])

  const looking = feedback.find(f => f.feedbackType === 'lookingAtInterviewer')?.isActive
  const [emoticonPositive, setEmoticonPositive] = useState<boolean | null>(null)
  const graceTimerRef = useRef<number | null>(null)

  const { countupSeconds, startCountup, stopCountup } = useCountup()

  // start countup if notification is a question
  useEffect(() => {
    if (isQuestion) {
      startCountup()
    }
    else {
      stopCountup()
    }
  }, [isQuestion, startCountup, stopCountup])

  // restart countup when a new topic arrives with a question
  useEffect(() => {
    if (newTopic && isQuestion) {
      startCountup()
    }
    else if (newTopic && !isQuestion) {
      stopCountup()
    }
  }, [newTopic, isQuestion, startCountup, stopCountup])

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
          icon={<IconAlertTriangleFilled size={iconSize} />}
          label="Off Topic"
          isActive={offTopic}
        />
        <FeedbackIcon
          icon={<IconBubbleTextFilled size={iconSize} />}
          label="Reduce Filler Words"
          isActive={showFillerWarning}
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
