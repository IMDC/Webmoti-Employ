import { ActionIcon } from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'
import { useAppStore } from '@/useAppStore'

export function SettingsButton() {
  const setIsSettingsOpen = useAppStore(s => s.setIsSettingsOpen)

  return (
    <ActionIcon variant="transparent" onClick={() => setIsSettingsOpen(true)}>
      <IconSettings />
    </ActionIcon>
  )
}
