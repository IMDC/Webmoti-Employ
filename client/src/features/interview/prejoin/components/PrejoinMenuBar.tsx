import { Button, Group, Popover } from '@mantine/core'
import { IconChevronUp } from '@tabler/icons-react'
import { useAppStore } from '@/useAppStore'
import { ToggleAudioButton } from '../../components/buttons/ToggleAudioButton'
import { ToggleVideoButton } from '../../components/buttons/ToggleVideoButton'
import { ChangeMediaDevice } from '../../components/ChangeMediaDevice'
import { useDeviceStore } from '../../zoom/useDeviceStore'
import { usePreviewStore } from '../hooks/usePreviewStore'

export function PrejoinMenuBar() {
  const toggleIsVideoOn = useAppStore(s => s.toggleIsVideoOn)
  const permissionState = useAppStore(s => s.permissionState)
  const disableMediaButtons = permissionState === 'idle' || permissionState === 'acquiring'

  const initDevices = useDeviceStore(s => s.initDevices)

  const toggleMuteMicrophone = usePreviewStore(s => s.toggleMuteMicrophone)
  const switchCamera = usePreviewStore(s => s.switchCamera)
  const switchMicrophone = usePreviewStore(s => s.switchMicrophone)

  async function onToggleMic() {
    if (permissionState !== 'granted') {
      await initDevices()
      return
    }
    toggleMuteMicrophone()
  }
  async function onToggleVideo() {
    if (permissionState !== 'granted') {
      await initDevices()
      return
    }
    toggleIsVideoOn()
  }

  return (
    <Group justify="center" align="center" h="100%" gap="sm">
      <Button.Group>
        <Popover>
          <Popover.Target>
            <Button variant="default" disabled={disableMediaButtons} px="xs">
              <IconChevronUp size={18} />
            </Button>
          </Popover.Target>
          <Popover.Dropdown>
            <ChangeMediaDevice
              mediaType="audio"
              variant="radio"
              onSwitchMicrophone={switchMicrophone}
            />
          </Popover.Dropdown>
        </Popover>

        <ToggleAudioButton onToggleMic={onToggleMic} />
      </Button.Group>

      <Button.Group>
        <Popover>
          <Popover.Target>
            <Button variant="default" disabled={disableMediaButtons} px="xs">
              <IconChevronUp size={18} />
            </Button>
          </Popover.Target>
          <Popover.Dropdown>
            <ChangeMediaDevice
              mediaType="video"
              variant="radio"
              onSwitchCamera={switchCamera}
            />
          </Popover.Dropdown>
        </Popover>

        <ToggleVideoButton onToggleVideo={onToggleVideo} />
      </Button.Group>
    </Group>
  )
}
