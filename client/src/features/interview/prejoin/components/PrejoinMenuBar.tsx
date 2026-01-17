import { Button, Group, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconBlur, IconBlurOff } from '@tabler/icons-react'
import { useAppPermissionState } from '@/useAppStore'
import { ToggleAudioButton } from '../../components/buttons/ToggleAudioButton'
import { ToggleVideoButton } from '../../components/buttons/ToggleVideoButton'
import { ChangeAudioPopover } from '../../components/popovers/ChangeAudioPopover'
import { ChangeVideoPopover } from '../../components/popovers/ChangeVideoPopover'
import { useDeviceStoreActions } from '../../zoom/useDeviceStore'
import { useIsVideoBlurred, useZoomSessionActions } from '../../zoom/useZoomSessionStore'
import { usePreviewActions } from '../hooks/usePreviewStore'

export function PrejoinMenuBar() {
  const { toggleIsVideoOn, toggleBlurPrejoin } = useZoomSessionActions()
  const isVideoBlurred = useIsVideoBlurred()
  const permissionState = useAppPermissionState()
  const { initDevices } = useDeviceStoreActions()
  const {
    toggleMuteMicrophone,
    switchCamera,
    switchMicrophone,
    switchSpeaker,
  } = usePreviewActions()

  const disableMediaButtons = permissionState === 'idle' || permissionState === 'acquiring'

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

  function handleBlurToggle() {
    // no need to show notification when turning blur off
    if (!isVideoBlurred) {
      notifications.show({
        title: 'Video Blur Activated',
        message: 'Your background will be blurred when joining the session',
      })
    }

    toggleBlurPrejoin()
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

      <Tooltip label="Toggle Blur" color="gray">
        <Button
          variant={isVideoBlurred ? 'gradient' : 'default'}
          onClick={handleBlurToggle}
          disabled={disableMediaButtons}
          // set width so it doesn't change when icon changes
          w={55}
        >
          {isVideoBlurred ? <IconBlur /> : <IconBlurOff />}
        </Button>
      </Tooltip>
    </Group>
  )
}
