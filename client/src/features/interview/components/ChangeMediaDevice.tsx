import type { MediaDevice } from '@zoom/videosdk'
import { Radio, Select, Stack, Text } from '@mantine/core'
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

type MediaType = 'audio' | 'video'
type Variant = 'dropdown' | 'radio'

interface DeviceSelectProps {
  label: string
  icon: React.ReactNode
  devices: MediaDevice[]
  selected: string | null
  onChange: (val: string) => void
  variant: Variant
}

function DeviceSelect({
  label,
  icon,
  devices,
  selected,
  onChange,
  variant,
}: DeviceSelectProps) {
  return variant === 'dropdown'
    ? (
        <Select
          label={label}
          data={devices.map(d => ({
            value: d.deviceId,
            label: d.label || `${label}: ${d.deviceId.slice(0, 4)}`,
          }))}
          value={selected}
          onChange={val => val && onChange(val)}
          leftSection={icon}
          leftSectionPointerEvents="none"
          comboboxProps={{ withinPortal: false }}
          styles={{ label: { paddingBottom: 8 } }}
        />
      )
    : (
        <Radio.Group
          label={label}
          value={selected || ''}
          onChange={onChange}
          styles={{ label: { paddingBottom: 8 } }}
        >
          <Stack gap="xs">
            {devices.map(d => (
              <Radio
                key={d.deviceId}
                value={d.deviceId}
                label={d.label || `${label}: ${d.deviceId.slice(0, 4)}`}
              />
            ))}
          </Stack>
        </Radio.Group>
      )
}

interface ChangeMediaDeviceProps {
  mediaType: MediaType
  variant?: Variant
  onSwitchCamera?: (deviceId: string) => void
  onSwitchMicrophone?: (deviceId: string) => void
  onSwitchSpeaker?: (deviceId: string) => void
}

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
          onChange={onSwitchMicrophone ?? (() => {})}
          variant={variant}
        />
        <DeviceSelect
          label="Audio Output"
          icon={<IconVolume size={18} />}
          devices={audioOutputDevices}
          selected={selectedAudioOutputDevice}
          onChange={onSwitchSpeaker ?? (() => {})}
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
      onChange={onSwitchCamera ?? (() => {})}
      variant={variant}
    />
  )
}
