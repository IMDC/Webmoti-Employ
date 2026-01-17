import { Button, Menu, Tooltip } from '@mantine/core'
import {
  IconBlur,
  IconBlurOff,
  IconDotsVertical,
  IconLayoutGrid,
  IconMaximize,
  IconMenu2,
  IconMinimize,
  IconSettings,
  IconUserFilled,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useAppActions } from '@/useAppStore'
import { useIsVideoBlurred, useZoomSessionActions } from '../../zoom/useZoomSessionStore'

interface ControlsMenuProps {
  onLayoutOpen?: () => void
  isMobile?: boolean
  sendDevIsJohnDoNotUseThis?: (isJohn: boolean, isInterviewer: boolean) => void
}

export function ControlsMenu({ onLayoutOpen, isMobile, sendDevIsJohnDoNotUseThis }: ControlsMenuProps) {
  const { setIsSettingsOpen } = useAppActions()
  const isVideoBlurred = useIsVideoBlurred()
  const { blurVideo } = useZoomSessionActions()

  const [isFullscreen, setIsFullscreen] = useState(false)

  const [isJohnInterviewerPressed, setIsJohnInterviewerPressed] = useState(false)
  const [isJohnCandidatePressed, setIsJohnCandidatePressed] = useState(false)

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

        <Menu.Item
          leftSection={
            isFullscreen ? <IconMinimize size={14} /> : <IconMaximize size={14} />
          }
          onClick={toggleFullscreen}
        >
          {isFullscreen ? 'Exit full screen' : 'Full screen'}
        </Menu.Item>

        <Menu.Item
          onClick={() => blurVideo(!isVideoBlurred)}
          leftSection={isVideoBlurred ? <IconBlurOff size={14} /> : <IconBlur size={14} />}
        >
          {isVideoBlurred ? 'Unblur Video' : 'Blur Video'}
        </Menu.Item>

        <Menu.Item onClick={() => setIsSettingsOpen(true)} leftSection={<IconSettings size={14} />}>
          Settings
        </Menu.Item>

        <Menu.Item
          closeMenuOnClick={false}
          onMouseDown={() => {
            setIsJohnInterviewerPressed(true)
            sendDevIsJohnDoNotUseThis?.(true, true)
          }}
          onMouseUp={() => {
            setIsJohnInterviewerPressed(false)
            sendDevIsJohnDoNotUseThis?.(false, true)
          }}
          onMouseLeave={() => {
            setIsJohnInterviewerPressed(false)
            sendDevIsJohnDoNotUseThis?.(false, true)
          }}
          leftSection={<IconUserFilled size={14} />}
          bg={isJohnInterviewerPressed ? 'blue' : undefined}
        >
          DEV: John (interviewer)
        </Menu.Item>
        <Menu.Item
          closeMenuOnClick={false}
          onMouseDown={() => {
            setIsJohnCandidatePressed(true)
            sendDevIsJohnDoNotUseThis?.(true, false)
          }}
          onMouseUp={() => {
            setIsJohnCandidatePressed(false)
            sendDevIsJohnDoNotUseThis?.(false, false)
          }}
          onMouseLeave={() => {
            setIsJohnCandidatePressed(false)
            sendDevIsJohnDoNotUseThis?.(false, false)
          }}
          leftSection={<IconUserFilled size={14} />}
          bg={isJohnCandidatePressed ? 'blue' : undefined}
        >
          DEV: John (candidate)
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
