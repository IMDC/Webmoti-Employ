import { Button, Menu, Tooltip } from '@mantine/core'
import {
  IconDotsVertical,
  IconLayoutGrid,
  IconMaximize,
  IconMenu2,
  IconMinimize,
  IconScreenShare,
  IconSettings,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/useAppStore'

interface ControlsMenuProps {
  onLayoutOpen?: () => void
  isMobile?: boolean
}

export function ControlsMenu({ onLayoutOpen, isMobile }: ControlsMenuProps) {
  const setIsSettingsOpen = useAppStore(state => state.setIsSettingsOpen)

  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
    else {
      document.documentElement.requestFullscreen()
    }
  }

  return (
    <Menu shadow="md" position="top-end">
      <Menu.Target>
        <Tooltip color="gray" label="Controls menu">
          <Button variant="default" px={{ base: 5, sm: 'md' }}>
            {isMobile ? <IconDotsVertical size={18} /> : <IconMenu2 size={18} />}
          </Button>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Controls</Menu.Label>

        <Menu.Item leftSection={<IconLayoutGrid size={14} />} onClick={onLayoutOpen}>
          Layout
        </Menu.Item>

        <Menu.Item leftSection={<IconScreenShare size={14} />}>Share screen</Menu.Item>

        <Menu.Item
          leftSection={
            isFullscreen ? <IconMinimize size={14} /> : <IconMaximize size={14} />
          }
          onClick={toggleFullscreen}
        >
          {isFullscreen ? 'Exit full screen' : 'Full screen'}
        </Menu.Item>

        <Menu.Item onClick={() => setIsSettingsOpen(true)} leftSection={<IconSettings size={14} />}>
          Settings
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
