import { ReactNode, useEffect, useState } from 'react';
import { IconMicrophone, IconVideo, IconVolume } from '@tabler/icons-react';
import { Select, Text } from '@mantine/core';
import { useAppStore } from '@/store';

interface ChangeMediaDeviceProps {
  mediaType: 'audio' | 'video';
}

interface DeviceSelectProps {
  label: string;
  icon: ReactNode;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
}

function DeviceSelect({ label, icon, options, value, onChange }: DeviceSelectProps) {
  return (
    <Select
      label={label}
      data={options}
      value={value}
      onChange={onChange}
      searchable={false}
      leftSection={icon}
      leftSectionPointerEvents="none"
      comboboxProps={{ withinPortal: false }}
    />
  );
}

function getDeviceOptions(
  devices: MediaDeviceInfo[],
  kind: MediaDeviceKind
): { value: string; label: string }[] {
  return devices
    .filter((d) => d.kind === kind && d.label)
    .map((d) => ({ value: d.deviceId, label: d.label }));
}

export function ChangeMediaDevice({ mediaType }: ChangeMediaDeviceProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const [audioInput, setAudioInput] = useState<string | null>(null);
  const [audioOutput, setAudioOutput] = useState<string | null>(null);
  const [videoInput, setVideoInput] = useState<string | null>(null);

  const isMediaDenied = useAppStore((state) => state.isMediaDenied);
  const setIsMediaDenied = useAppStore.getState().setIsMediaDenied;

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        setDevices(list);

        const hasLabels = list.some((d) => d.label);
        setIsMediaDenied(!hasLabels);

        if (hasLabels) {
          const audioInputs = getDeviceOptions(list, 'audioinput');
          const audioOutputs = getDeviceOptions(list, 'audiooutput');
          const videoInputs = getDeviceOptions(list, 'videoinput');

          if (!audioInput && audioInputs[0]) {
            setAudioInput(audioInputs[0].value);
          }
          if (!audioOutput && audioOutputs[0]) {
            setAudioOutput(audioOutputs[0].value);
          }
          if (!videoInput && videoInputs[0]) {
            setVideoInput(videoInputs[0].value);
          }
        }
      } catch {
        setIsMediaDenied(true);
      }
    };

    fetchDevices();
    navigator.mediaDevices.addEventListener('devicechange', fetchDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', fetchDevices);
    };
  }, [audioInput, audioOutput, videoInput]);

  if (isMediaDenied) {
    return <Text>Media permissions denied</Text>;
  }

  const audioInputs = getDeviceOptions(devices, 'audioinput');
  const audioOutputs = getDeviceOptions(devices, 'audiooutput');
  const videoInputs = getDeviceOptions(devices, 'videoinput');

  if (mediaType === 'audio') {
    return (
      <>
        <DeviceSelect
          label="Audio input"
          icon={<IconMicrophone stroke={1.5} size={16} />}
          options={audioInputs}
          value={audioInput}
          onChange={setAudioInput}
        />
        <DeviceSelect
          label="Audio output"
          icon={<IconVolume stroke={1.5} size={16} />}
          options={audioOutputs}
          value={audioOutput}
          onChange={setAudioOutput}
        />
      </>
    );
  }

  if (mediaType === 'video') {
    return (
      <DeviceSelect
        label="Video input"
        icon={<IconVideo stroke={1.5} size={16} />}
        options={videoInputs}
        value={videoInput}
        onChange={setVideoInput}
      />
    );
  }

  return null;
}
