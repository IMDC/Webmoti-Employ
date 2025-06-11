import {
  IconChevronUp,
  IconMenu2,
  IconMicrophone,
  IconMicrophoneOff,
  IconPhoneOff,
  IconVideo,
  IconVideoOff,
} from '@tabler/icons-react';
import { Button, Flex, Indicator } from '@mantine/core';
import { useAppStore } from '@/store';

type MenuBarProps = {
  onToggleMic: () => void;
  onToggleVideo: () => void;
  isPrejoin?: boolean;
  disableMediaButtons?: boolean;
};

export function MenuBar({
  onToggleMic,
  onToggleVideo,
  isPrejoin = false,
  disableMediaButtons = false,
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
        <Button variant="default" disabled={disableMediaButtons}>
          <IconChevronUp stroke={1.5} size={16} />
        </Button>
        {isMediaDenied ? <Indicator color="orange">{MicButton}</Indicator> : MicButton}
      </Button.Group>

      <Button.Group>
        <Button variant="default" disabled={disableMediaButtons}>
          <IconChevronUp stroke={1.5} size={16} />
        </Button>
        {isMediaDenied ? <Indicator color="orange">{VideoButton}</Indicator> : VideoButton}
      </Button.Group>

      <Button variant="default">
        <IconMenu2 stroke={1.5} size={16} />
      </Button>

      {!isPrejoin && (
        <Button color="red">
          <IconPhoneOff stroke={1.5} size={16} />
        </Button>
      )}
    </Flex>
  );
}
