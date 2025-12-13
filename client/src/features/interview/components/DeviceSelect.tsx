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
          value={selected}
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
