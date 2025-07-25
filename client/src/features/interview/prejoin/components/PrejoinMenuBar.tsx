import { Button, Group } from '@mantine/core'
import { useAppPermissionState } from '@/useAppStore'
import { ToggleAudioButton } from '../../components/buttons/ToggleAudioButton'
import { ToggleVideoButton } from '../../components/buttons/ToggleVideoButton'
import { ChangeAudioPopover } from '../../components/popovers/ChangeAudioPopover'
import { ChangeVideoPopover } from '../../components/popovers/ChangeVideoPopover'
import { useDeviceStore } from '../../zoom/useDeviceStore'
import { useZoomSessionStore } from '../../zoom/useZoomSessionStore'
import { usePreviewStore } from '../hooks/usePreviewStore'

export function PrejoinMenuBar() {
  const toggleIsVideoOn = useZoomSessionStore(s => s.toggleIsVideoOn)
  const permissionState = useAppPermissionState()

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
        <ChangeAudioPopover switchMicrophone={switchMicrophone} />
        <ToggleAudioButton onToggleMic={onToggleMic} />
      </Button.Group>

      <Button.Group>
        <ChangeVideoPopover switchCamera={switchCamera} />
        <ToggleVideoButton onToggleVideo={onToggleVideo} />
      </Button.Group>
    </Group>
  )
}
