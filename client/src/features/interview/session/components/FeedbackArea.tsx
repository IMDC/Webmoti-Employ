import type { InterviewFeedback } from '../hooks/useInterviewFeedback'
import { Box, Center, Group, Stack, Text, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconAlertTriangleFilled,
  IconBubbleTextFilled,
  IconClockHour4Filled,
  IconMoodSad,
  IconMoodSmileBeam,
  IconStepInto,
} from '@tabler/icons-react'

interface FeedbackAreaProps {
  feedback: InterviewFeedback
}

export function FeedbackArea({ feedback }: FeedbackAreaProps) {
  const theme = useMantineTheme()
  const isXL = useMediaQuery(`(min-width: ${theme.breakpoints.xl})`)
  const iconSize = isXL ? 64 : 36

  const {
    hint,
    showHint,
    showOffTopic,
    showFillerWarning,
    countupSeconds,
    eyeContact,
  } = feedback

  return (
    <Center h="100%">
      <Group gap={70}>
        <FeedbackIcon
          icon={<IconMoodSmileBeam size={iconSize} />}
          label="Eye Contact"
          isActive={eyeContact === 'good'}
        />
        <FeedbackIcon
          icon={<IconMoodSad size={iconSize} />}
          label="Look at Interviewer"
          isActive={eyeContact === 'bad'}
        />
        <FeedbackIcon
          icon={<IconClockHour4Filled size={iconSize} />}
          label={`${countupSeconds}s`}
          isActive={countupSeconds > 0}
        />
        <FeedbackIcon
          icon={<IconStepInto size={iconSize} />}
          label={hint.join(', ')}
          isActive={showHint}
        />
        <FeedbackIcon
          icon={<IconAlertTriangleFilled size={iconSize} />}
          label="Off Topic"
          isActive={showOffTopic}
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
      <Box c="#FFC107">{icon}</Box>
      <Text fz={{ base: 'lg', xl: 'xl' }} fw="bold" c="#FFC107">{label}</Text>
    </Stack>
  )
}
