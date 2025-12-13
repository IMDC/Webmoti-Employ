import type { MediaDevice } from '@zoom/videosdk'
import type { Variant } from './ChangeMediaDevice'
import { Radio, Select, Stack } from '@mantine/core'

interface DeviceSelectProps {
  label: string
  icon: React.ReactNode
  devices: MediaDevice[]
  selected: string | null
  onChange: (val: string) => Promise<void>
  variant: Variant
}

export function DeviceSelect({
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
