import { useEffect, useState } from 'react';
import { IconMicrophone, IconVideo, IconVolume } from '@tabler/icons-react';
import { Radio, Select, Stack, Text } from '@mantine/core';
import { useAppStore } from '@/stores/store';
import { useZoomPreviewStore } from '@/stores/ZoomPreviewStore';

type MediaType = 'audio' | 'video';
type Variant = 'dropdown' | 'radio';

interface ChangeMediaDeviceProps {
  mediaType: MediaType;
  variant?: Variant;
}

export function ChangeMediaDevice({ mediaType, variant = 'dropdown' }: ChangeMediaDeviceProps) {
  const { audioInputDevices, audioOutputDevices, videoDevices } = useZoomPreviewStore();

  const permissionState = useAppStore((s) => s.permissionState);

  const [selectedInput, setSelectedInput] = useState<string | null>(null);
  const [selectedOutput, setSelectedOutput] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedInput && audioInputDevices.length) {
      setSelectedInput(audioInputDevices[0].deviceId);
    }
    if (!selectedOutput && audioOutputDevices.length) {
      setSelectedOutput(audioOutputDevices[0].deviceId);
    }
    if (!selectedVideo && videoDevices.length) {
      setSelectedVideo(videoDevices[0].deviceId);
    }
  }, [audioInputDevices, audioOutputDevices, videoDevices]);

  if (permissionState === 'denied') {
    return <Text>Media permissions denied</Text>;
  }

  if (mediaType === 'audio') {
    if (variant === 'dropdown') {
      return (
        <Stack>
          <Select
            label="Audio Input Devices"
            data={audioInputDevices.map((d) => ({
              value: d.deviceId,
              label: d.label || `Mic: ${d.deviceId.slice(0, 4)}`,
            }))}
            value={selectedInput}
            onChange={setSelectedInput}
            leftSection={<IconMicrophone size={16} stroke={1.5} />}
            leftSectionPointerEvents="none"
            comboboxProps={{ withinPortal: false }}
          />
          <Select
            label="Audio Output Devices"
            data={audioOutputDevices.map((d) => ({
              value: d.deviceId,
              label: d.label || `Speaker: ${d.deviceId.slice(0, 4)}`,
            }))}
            value={selectedOutput}
            onChange={setSelectedOutput}
            leftSection={<IconVolume size={16} stroke={1.5} />}
            leftSectionPointerEvents="none"
            comboboxProps={{ withinPortal: false }}
          />
        </Stack>
      );
    }

    return (
      <Stack>
        <Text size="sm" fw={500}>
          Audio Input Devices
        </Text>
        <Radio.Group value={selectedInput || ''} onChange={setSelectedInput}>
          <Stack gap="xs">
            {audioInputDevices.map((d) => (
              <Radio
                key={d.deviceId}
                value={d.deviceId}
                label={d.label || `Mic: ${d.deviceId.slice(0, 4)}`}
              />
            ))}
          </Stack>
        </Radio.Group>

        <Text size="sm" fw={500}>
          Audio Output Devices
        </Text>

        <Radio.Group value={selectedOutput || ''} onChange={setSelectedOutput}>
          <Stack gap="xs">
            {audioOutputDevices.map((d) => (
              <Radio
                key={d.deviceId}
                value={d.deviceId}
                label={d.label || `Speaker: ${d.deviceId.slice(0, 4)}`}
              />
            ))}
          </Stack>
        </Radio.Group>
      </Stack>
    );
  }

  const videoOptions = videoDevices.map((d) => ({
    value: d.deviceId,
    label: d.label || `Cam: ${d.deviceId.slice(0, 4)}`,
  }));

  if (variant === 'dropdown') {
    return (
      <Select
        label="Video Input"
        data={videoOptions}
        value={selectedVideo}
        onChange={setSelectedVideo}
        leftSection={<IconVideo size={16} stroke={1.5} />}
        leftSectionPointerEvents="none"
        comboboxProps={{ withinPortal: false }}
        searchable={false}
      />
    );
  }

  return (
    <Radio.Group label="Video Input" value={selectedVideo || ''} onChange={setSelectedVideo}>
      <Stack gap="xs" mt="xs">
        {videoOptions.map((opt) => (
          <Radio key={opt.value} value={opt.value} label={opt.label} />
        ))}
      </Stack>
    </Radio.Group>
  );
}
