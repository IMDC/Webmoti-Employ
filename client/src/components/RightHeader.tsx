import { Group, Text } from '@mantine/core'
import { UserButton } from '@/features/auth/components/UserButton'
import { useCurrentTime } from '@/hooks/useCurrentTime'
import { SettingsButton } from './SettingsButton'

export function RightHeader() {
  const time = useCurrentTime()

  return (
    <Group>
      <Text ff="monospace">{time}</Text>
      <SettingsButton />
      <UserButton />
    </Group>
  )
}
