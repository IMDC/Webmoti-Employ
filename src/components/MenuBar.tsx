import {
  IconChevronUp,
  IconMicrophone,
  IconMicrophoneOff,
  IconPhoneOff,
  IconVideo,
  IconVideoOff,
} from '@tabler/icons-react';
import { Button, Flex, Indicator, Popover } from '@mantine/core';
import { useAppStore } from '../store';
import { ChangeMediaDevice } from './ChangeMediaDevice';
import { ControlsMenu } from './ControlsMenu';

interface MenuBarProps {
  onToggleMic: () => void;
  onToggleVideo: () => void;
  isPrejoin?: boolean;
  disableMediaButtons?: boolean;
  onLeave?: () => void;
}

export function MenuBar({
  onToggleMic,
  onToggleVideo,
  isPrejoin = false,
  disableMediaButtons = false,
  onLeave,
}: MenuBarProps) {
  const isMediaDenied = useAppStore((state) => state.isMediaDenied);
  const isAudioOn = useAppStore((state) => state.isAudioOn);
  const isVideoOn = useAppStore((state) => state.isVideoOn);

  const MicButton = (
    <Button
      variant={isAudioOn ? 'default' : 'filled'}
      color="red"
      onClick={onToggleMic}
      disabled={disableMediaButtons}
    >
      {isAudioOn ? (
        <IconMicrophone stroke={1.5} size={16} />
      ) : (
        <IconMicrophoneOff stroke={1.5} size={16} />
      )}
    </Button>
  );

  const VideoButton = (
    <Button
      variant={isVideoOn ? 'default' : 'filled'}
      color="red"
      onClick={onToggleVideo}
      disabled={disableMediaButtons}
    >
      {isVideoOn ? <IconVideo stroke={1.5} size={16} /> : <IconVideoOff stroke={1.5} size={16} />}
    </Button>
  );

  return (
    <Flex justify="center" align="center" h="100%" gap="md">
      <Button.Group>
        <Popover>
          <Popover.Target>
            <Button variant="default" disabled={disableMediaButtons}>
              <IconChevronUp stroke={1.5} size={16} />
            </Button>
          </Popover.Target>

          <Popover.Dropdown>
            <ChangeMediaDevice mediaType="audio" />
          </Popover.Dropdown>
        </Popover>

        {isMediaDenied ? <Indicator color="orange">{MicButton}</Indicator> : MicButton}
      </Button.Group>

      <Button.Group>
        <Popover>
          <Popover.Target>
            <Button variant="default" disabled={disableMediaButtons}>
              <IconChevronUp stroke={1.5} size={16} />
            </Button>
          </Popover.Target>

          <Popover.Dropdown>
            <ChangeMediaDevice mediaType="video" />
          </Popover.Dropdown>
        </Popover>

        {isMediaDenied ? <Indicator color="orange">{VideoButton}</Indicator> : VideoButton}
      </Button.Group>

      <ControlsMenu />

      {!isPrejoin && (
        <Button color="red" onClick={onLeave}>
          <IconPhoneOff stroke={1.5} size={16} />
        </Button>
      )}
    </Flex>
  );
}
