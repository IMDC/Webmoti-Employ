import { Button, Group, Skeleton, Stack, Text, Tooltip } from '@mantine/core'
import { IconBlur, IconBlurOff, IconMicrophone, IconVideo, IconVolume } from '@tabler/icons-react'
import { useAppPermissionState } from '@/useAppStore'
import { ToggleAudioButton } from '../../components/buttons/ToggleAudioButton'
import { ToggleVideoButton } from '../../components/buttons/ToggleVideoButton'
import { ChangeAudioPopover } from '../../components/popovers/ChangeAudioPopover'
import { ChangeVideoPopover } from '../../components/popovers/ChangeVideoPopover'
import {
  useAudioInputDevices,
  useAudioOutputDevices,
  useDeviceStoreActions,
  useSelectedAudioInputDevice,
  useSelectedAudioOutputDevice,
  useSelectedVideoDevice,
  useVideoDevices,
} from '../../zoom/useDeviceStore'
import { useIsVideoBlurred, useZoomSessionActions } from '../../zoom/useZoomSessionStore'
import { usePreviewActions } from '../hooks/usePreviewStore'

export function PrejoinMenuBar() {
  const { toggleIsVideoOn } = useZoomSessionActions()
  const isVideoBlurred = useIsVideoBlurred()
  const permissionState = useAppPermissionState()
  const { initDevices } = useDeviceStoreActions()
  const {
    toggleMuteMicrophone,
    switchCamera,
    switchMicrophone,
    switchSpeaker,
    toggleBlurBackground,
  } = usePreviewActions()

  const audioInputDevices = useAudioInputDevices()
  const audioOutputDevices = useAudioOutputDevices()
  const videoDevices = useVideoDevices()
  const selectedAudioInputDevice = useSelectedAudioInputDevice()
  const selectedAudioOutputDevice = useSelectedAudioOutputDevice()
  const selectedVideoDevice = useSelectedVideoDevice()

  const micLabel = audioInputDevices.find(d => d.deviceId === selectedAudioInputDevice)?.label
  const speakerLabel = audioOutputDevices.find(d => d.deviceId === selectedAudioOutputDevice)?.label
  const cameraLabel = videoDevices.find(d => d.deviceId === selectedVideoDevice)?.label

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

  return (
    <Stack gap="xs">
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
            onClick={toggleBlurBackground}
            disabled={disableMediaButtons}
            // set width so it doesn't change when icon changes
            w={55}
          >
            {isVideoBlurred ? <IconBlur /> : <IconBlurOff />}
          </Button>
        </Tooltip>
      </Group>

      <Stack gap={2}>
        {permissionState === 'denied'
          ? (
              <Text size="xs" c="red" ta="center">Media permissions blocked</Text>
            )
          : (
              <>
                <Skeleton visible={permissionState !== 'granted'} h={18}>
                  {micLabel && (
                    <Group gap={4} justify="center" wrap="nowrap">
                      <IconMicrophone size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
                      <Text size="xs" c="dimmed" truncate>{micLabel}</Text>
                    </Group>
                  )}
                </Skeleton>
                <Skeleton visible={permissionState !== 'granted'} h={18}>
                  {speakerLabel && (
                    <Group gap={4} justify="center" wrap="nowrap">
                      <IconVolume size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
                      <Text size="xs" c="dimmed" truncate>{speakerLabel}</Text>
                    </Group>
                  )}
                </Skeleton>
                <Skeleton visible={permissionState !== 'granted'} h={18}>
                  {cameraLabel && (
                    <Group gap={4} justify="center" wrap="nowrap">
                      <IconVideo size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
                      <Text size="xs" c="dimmed" truncate>{cameraLabel}</Text>
                    </Group>
                  )}
                </Skeleton>
              </>
            )}
      </Stack>
    </Stack>
  )
}
