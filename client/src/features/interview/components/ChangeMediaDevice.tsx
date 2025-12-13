import { Stack, Text } from '@mantine/core'
import { IconMicrophone, IconVideo, IconVolume } from '@tabler/icons-react'
import {
  useAudioInputDevices,
  useAudioOutputDevices,
  useSelectedAudioInputDevice,
  useSelectedAudioOutputDevice,
  useSelectedVideoDevice,
  useVideoDevices,
} from '@/features/interview/zoom/useDeviceStore'
import { useAppPermissionState } from '@/useAppStore'
import { DeviceSelect } from './DeviceSelect'

export type MediaType = 'audio' | 'video'
export type Variant = 'dropdown' | 'radio'

interface ChangeMediaDeviceProps {
  mediaType: MediaType
  variant?: Variant
  onSwitchCamera?: (deviceId: string) => Promise<void>
  onSwitchMicrophone?: (deviceId: string) => Promise<void>
  onSwitchSpeaker?: (deviceId: string) => Promise<void>
}

async function noopAsync(_?: any) {}

export function ChangeMediaDevice({
  mediaType,
  variant = 'dropdown',
  onSwitchCamera,
  onSwitchMicrophone,
  onSwitchSpeaker,
}: ChangeMediaDeviceProps) {
  const permissionState = useAppPermissionState()
  const videoDevices = useVideoDevices()
  const audioInputDevices = useAudioInputDevices()
  const audioOutputDevices = useAudioOutputDevices()
  const selectedVideoDevice = useSelectedVideoDevice()
  const selectedAudioInputDevice = useSelectedAudioInputDevice()
  const selectedAudioOutputDevice = useSelectedAudioOutputDevice()

  if (permissionState === 'denied') {
    return <Text>Media permissions denied</Text>
  }

  if (mediaType === 'audio') {
    return (
      <Stack>
        <DeviceSelect
          label="Audio Input"
          icon={<IconMicrophone size={18} />}
          devices={audioInputDevices}
          selected={selectedAudioInputDevice}
          onChange={onSwitchMicrophone ?? noopAsync}
          variant={variant}
        />
        <DeviceSelect
          label="Audio Output"
          icon={<IconVolume size={18} />}
          devices={audioOutputDevices}
          selected={selectedAudioOutputDevice}
          onChange={onSwitchSpeaker ?? noopAsync}
          variant={variant}
        />
      </Stack>
    )
  }

  return (
    <DeviceSelect
      label="Video Input"
      icon={<IconVideo size={18} />}
      devices={videoDevices}
      selected={selectedVideoDevice}
      onChange={onSwitchCamera ?? noopAsync}
      variant={variant}
    />
  )
}
