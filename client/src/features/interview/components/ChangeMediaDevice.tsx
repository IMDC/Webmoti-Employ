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
  onChange: (val: string) => Promise<void>
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
  // change to null when selected device is missing to avoid controlled/uncontrolled error
  const value
    = selected && devices.some(d => d.deviceId === selected)
      ? selected
      : null

  return variant === 'dropdown'
    ? (
        <Select
          label={label}
          data={devices.map(d => ({
            value: d.deviceId,
            label: d.label || `${label}: ${d.deviceId.slice(0, 4)}`,
          }))}
          value={value}
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
          value={value}
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
