import { IconMicrophone, IconVideo, IconVolume } from '@tabler/icons-react';
import { Radio, Select, Stack, Text } from '@mantine/core';
import { useDeviceStore } from '@/features/interview/zoom/useDeviceStore';
import { useAppStore } from '@/stores/useAppStore';

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
          icon={<IconMicrophone size={18} />}
          devices={audioInputDevices}
          selected={selectedAudioInputDevice}
          onChange={onSwitchMicrophone ?? (() => {})}
        />
        <DeviceSelect
          label="Audio Output"
          icon={<IconVolume size={18} />}
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
      icon={<IconVideo size={18} />}
      devices={videoDevices}
      selected={selectedVideoDevice}
      onChange={onSwitchCamera ?? (() => {})}
    />
  );
}
