import { Button, Group } from '@mantine/core'
import { useAppPermissionState } from '@/useAppStore'
import { ToggleAudioButton } from '../../components/buttons/ToggleAudioButton'
import { ToggleVideoButton } from '../../components/buttons/ToggleVideoButton'
import { ChangeAudioPopover } from '../../components/popovers/ChangeAudioPopover'
import { ChangeVideoPopover } from '../../components/popovers/ChangeVideoPopover'
import { useDeviceStoreActions } from '../../zoom/useDeviceStore'
import { useZoomSessionActions } from '../../zoom/useZoomSessionStore'
import { usePreviewActions } from '../hooks/usePreviewStore'

export function PrejoinMenuBar() {
  const { toggleIsVideoOn } = useZoomSessionActions()
  const permissionState = useAppPermissionState()
  const { initDevices } = useDeviceStoreActions()
  const {
    toggleMuteMicrophone,
    switchCamera,
    switchMicrophone,
    switchSpeaker,
  } = usePreviewActions()

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
        <ChangeAudioPopover switchMicrophone={switchMicrophone} switchSpeaker={switchSpeaker} />
        <ToggleAudioButton onToggleMic={onToggleMic} />
      </Button.Group>

      <Button.Group>
        <ChangeVideoPopover switchCamera={switchCamera} />
        <ToggleVideoButton onToggleVideo={onToggleVideo} />
      </Button.Group>
    </Group>
  )
}
