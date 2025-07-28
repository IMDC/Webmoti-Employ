import { ActionIcon } from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'
import { useAppActions } from '@/useAppStore'

export function SettingsButton() {
  const { setIsSettingsOpen } = useAppActions()

  return (
    <ActionIcon variant="transparent" onClick={() => setIsSettingsOpen(true)}>
      <IconSettings />
    </ActionIcon>
  )
}
