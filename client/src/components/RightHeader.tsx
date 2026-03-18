import { ActionIcon, Group, Text, Tooltip } from '@mantine/core'
import { IconShieldCog } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useIsAdmin } from '@/features/admin/queries'
import { UserButton } from '@/features/auth/components/UserButton'
import { useCurrentTime } from '@/hooks/useCurrentTime'
import { SettingsButton } from './SettingsButton'

export function RightHeader() {
  const time = useCurrentTime()
  const { data: isAdmin } = useIsAdmin()

  return (
    <Group>
      <Text ff="monospace">{time}</Text>
      {isAdmin && (
        <Tooltip label="Admin">
          <ActionIcon component={Link} to="/admin" variant="subtle" size="lg" aria-label="Admin">
            <IconShieldCog size={20} />
          </ActionIcon>
        </Tooltip>
      )}
      <SettingsButton />
      <UserButton />
    </Group>
  )
}
