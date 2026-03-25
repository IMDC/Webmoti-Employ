import { Button, Menu, Slider, Text, Tooltip } from '@mantine/core'
import {
  IconBlur,
  IconBlurOff,
  IconChartHistogram,
  IconDotsVertical,
  IconLayoutGrid,
  IconMaximize,
  IconMenu2,
  IconMinimize,
  IconSettings,
  IconUserFilled,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useAppActions, useAppBlurIntensity } from '@/useAppStore'
import { isElectron } from '@/utils/utils'
import { useIsVideoBlurred, useZoomSessionActions } from '../../zoom/useZoomSessionStore'
import { StatisticsModal } from './StatisticsModal'

interface ControlsMenuProps {
  onLayoutOpen?: () => void
  isMobile?: boolean
  sendDevIsJohnDoNotUseThis?: (isJohn: boolean, isInterviewer: boolean) => void
  sendResetMessages?: () => void
}

export function ControlsMenu({ onLayoutOpen, isMobile, sendDevIsJohnDoNotUseThis, sendResetMessages }: ControlsMenuProps) {
  const { setIsSettingsOpen, setBlurIntensity } = useAppActions()
  const blurIntensity = useAppBlurIntensity()
  const isVideoBlurred = useIsVideoBlurred()
  const { blurVideo } = useZoomSessionActions()

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false)

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
    <>
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
            leftSection={isVideoBlurred ? <IconBlur size={14} /> : <IconBlurOff size={14} />}
          >
            {isVideoBlurred ? 'Unblur Video' : 'Blur Video'}
          </Menu.Item>

          {isElectron() && (
            <Menu.Item closeMenuOnClick={false} component="div">
              <Text size="xs" fw={500} mb={4}>Eyetracker Blur</Text>
              <Slider
                min={0}
                max={50}
                value={blurIntensity}
                onChange={setBlurIntensity}
                label={value => `${value}px`}
                size="sm"
              />
            </Menu.Item>
          )}

          <Menu.Item onClick={() => setIsSettingsOpen(true)} leftSection={<IconSettings size={14} />}>
            Settings
          </Menu.Item>

          <Menu.Item onClick={() => setIsStatisticsOpen(true)} leftSection={<IconChartHistogram size={14} />}>
            Statistics
          </Menu.Item>

          {import.meta.env.DEV && (
            <>
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

              <Menu.Divider />
              <Menu.Item
                color="red"
                onClick={() => sendResetMessages?.()}
              >
                DEV: Reset AI Messages
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>

      <StatisticsModal opened={isStatisticsOpen} onClose={() => setIsStatisticsOpen(false)} />
    </>
  )
}
