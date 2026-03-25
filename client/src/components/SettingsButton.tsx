import { ActionIcon } from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'
import { useAppActions } from '@/useAppStore'

export function SettingsButton() {
  const { setIsSettingsOpen } = useAppActions()

  return (
    <ActionIcon variant="subtle" onClick={() => setIsSettingsOpen(true)} aria-label="Open settings">
      <IconSettings />
    </ActionIcon>
  )
}
