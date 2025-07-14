import { Button, Menu } from '@mantine/core'
import { IconDotsVertical, IconLayoutGrid, IconMenu2, IconScreenShare, IconSettings } from '@tabler/icons-react'
import { useAppStore } from '@/useAppStore'

interface ControlsMenuProps {
  onLayoutOpen?: () => void
  isMobile?: boolean
}

export function ControlsMenu({ onLayoutOpen, isMobile }: ControlsMenuProps) {
  const setIsSettingsOpen = useAppStore(state => state.setIsSettingsOpen)

  return (
    <Menu shadow="md" position="top-end">
      <Menu.Target>
        <Button variant="default" px={{ base: 5, sm: 'md' }}>
          {isMobile ? <IconDotsVertical size={18} /> : <IconMenu2 size={18} />}
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Controls</Menu.Label>

        <Menu.Item leftSection={<IconLayoutGrid size={14} />} onClick={onLayoutOpen}>
          Layout
        </Menu.Item>

        <Menu.Item leftSection={<IconScreenShare size={14} />}>Share Screen</Menu.Item>

        <Menu.Item onClick={() => setIsSettingsOpen(true)} leftSection={<IconSettings size={14} />}>
          Settings
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
