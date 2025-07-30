import { Box, Card, Center, Group, Stack, Text } from '@mantine/core'
import {
  IconEyeCheck,
  IconEyeClosed,
  IconEyeDotted,
  IconEyeFilled,
  IconMoodHappyFilled,
  IconMoodSad,
} from '@tabler/icons-react'
import { useFeedback } from '../hooks/useFeedback'

function FeedbackIcon({ iconActive, iconInactive, label, isActive }: {
  iconActive: React.ReactNode
  iconInactive: React.ReactNode
  label: string
  isActive?: boolean
}) {
  return (
    <Stack align="center" gap={0}>
      {isActive ? iconActive : iconInactive}
      <Text size="xs" c="dimmed" fw={isActive ? 'bolder' : 'normal'}>{label}</Text>
    </Stack>
  )
}

export function FeedbackArea() {
  const feedback = useFeedback()

  const fixation = feedback.find(f => f.feedbackType === 'fixation')?.isActive
  const looking = feedback.find(f => f.feedbackType === 'lookingAtInterviewer')?.isActive

  return (
    <Box w="100%" h="100%" px="md" py="xs">
      <Card
        withBorder
        radius="xl"
        h="100%"
      >
        <Center h="100%">
          <Group justify="center" align="center" gap={70}>
            <FeedbackIcon
              iconActive={<IconEyeFilled size={24} />}
              iconInactive={<IconEyeDotted size={24} />}
              label="Fixation"
              isActive={fixation}
            />
            <FeedbackIcon
              iconActive={<IconEyeCheck size={24} />}
              iconInactive={<IconEyeClosed size={24} />}
              label="Looking at Interviewer"
              isActive={looking}
            />
            <FeedbackIcon
              iconActive={<IconMoodSad size={24} />}
              iconInactive={<IconMoodSad size={24} />}
              label="Bad"
            />
            <FeedbackIcon
              iconActive={<IconMoodHappyFilled size={24} />}
              iconInactive={<IconMoodHappyFilled size={24} />}
              label="Happy person"
            />
          </Group>
        </Center>
      </Card>
    </Box>
  )
}
