import { IconMicrophone, IconVideo, IconVolume } from '@tabler/icons-react';
import { Radio, Select, Stack, Text } from '@mantine/core';
import { useAppStore } from '@/stores/useAppStore';
import { useDeviceStore } from '@/stores/useDeviceStore';

type MediaType = 'audio' | 'video';
type Variant = 'dropdown' | 'radio';

interface ChangeMediaDeviceProps {
  mediaType: MediaType;
  variant?: Variant;
  onSwitchCamera?: (deviceId: string) => void;
  onSwitchMicrophone?: (deviceId: string) => void;
}

export function ChangeMediaDevice({
  mediaType,
  variant = 'dropdown',
  onSwitchCamera,
  onSwitchMicrophone,
}: ChangeMediaDeviceProps) {
  const permissionState = useAppStore((s) => s.permissionState);
  const videoDevices = useDeviceStore((s) => s.videoDevices);
  const audioInputDevices = useDeviceStore((s) => s.audioInputDevices);
  const audioOutputDevices = useDeviceStore((s) => s.audioOutputDevices);
  const selectedVideoDevice = useDeviceStore((s) => s.selectedVideoDevice);
  const selectedAudioInputDevice = useDeviceStore((s) => s.selectedAudioInputDevice);
  const selectedAudioOutputDevice = useDeviceStore((s) => s.selectedAudioOutputDevice);

  if (permissionState === 'denied') {
    return <Text>Media permissions denied</Text>;
  }

  const DeviceSelect = ({
    label,
    icon,
    devices,
    selected,
    onChange,
  }: {
    label: string;
    icon: React.ReactNode;
    devices: MediaDeviceInfo[];
    selected: string | null;
    onChange: (val: string) => void;
  }) =>
    variant === 'dropdown' ? (
      <Select
        label={label}
        data={devices.map((d) => ({
          value: d.deviceId,
          label: d.label || `${label}: ${d.deviceId.slice(0, 4)}`,
        }))}
        value={selected}
        onChange={(val) => val && onChange(val)}
        leftSection={icon}
        leftSectionPointerEvents="none"
        comboboxProps={{ withinPortal: false }}
      />
    ) : (
      <Radio.Group label={label} value={selected || ''} onChange={onChange}>
        <Stack gap="xs">
          {devices.map((d) => (
            <Radio
              key={d.deviceId}
              value={d.deviceId}
              label={d.label || `${label}: ${d.deviceId.slice(0, 4)}`}
            />
          ))}
        </Stack>
      </Radio.Group>
    );

  if (mediaType === 'audio') {
    return (
      <Stack>
        <DeviceSelect
          label="Audio Input"
          icon={<IconMicrophone size={16} stroke={1.5} />}
          devices={audioInputDevices}
          selected={selectedAudioInputDevice}
          onChange={onSwitchMicrophone ?? (() => {})}
        />
        <DeviceSelect
          label="Audio Output"
          icon={<IconVolume size={16} stroke={1.5} />}
          devices={audioOutputDevices}
          selected={selectedAudioOutputDevice}
          onChange={() => {}}
        />
      </Stack>
    );
  }

  return (
    <DeviceSelect
      label="Video Input"
      icon={<IconVideo size={16} stroke={1.5} />}
      devices={videoDevices}
      selected={selectedVideoDevice}
      onChange={onSwitchCamera ?? (() => {})}
    />
  );
}
