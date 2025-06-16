import {
  IconChevronUp,
  IconMessage,
  IconMicrophone,
  IconMicrophoneOff,
  IconPhoneOff,
  IconVideo,
  IconVideoOff,
} from '@tabler/icons-react';
import { Button, Flex, Indicator, Popover } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAppStore } from '../store';
import { ChangeLayoutModal } from './ChangeLayoutModal/ChangeLayoutModal';
import { ChangeMediaDevice } from './ChangeMediaDevice';
import { ControlsMenu } from './ControlsMenu';

interface MenuBarProps {
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleChat?: () => void;
  isPrejoin?: boolean;
  disableMediaButtons?: boolean;
  onLeave?: () => void;
}

export function MenuBar({
  onToggleMic,
  onToggleVideo,
  onToggleChat,
  isPrejoin = false,
  disableMediaButtons = false,
  onLeave,
}: MenuBarProps) {
  const isMediaDenied = useAppStore((state) => state.isMediaDenied);
  const isAudioOn = useAppStore((state) => state.isAudioOn);
  const isVideoOn = useAppStore((state) => state.isVideoOn);

  const [isLayoutModalOpen, { open: openLayoutModal, close: closeLayoutModal }] =
    useDisclosure(false);

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

      <ControlsMenu onLayoutOpen={openLayoutModal} />

      <ChangeLayoutModal isOpen={isLayoutModalOpen} onClose={closeLayoutModal} />

      {!isPrejoin && (
        <>
          <Button variant="default" onClick={onToggleChat}>
            <IconMessage stroke={1.5} size={16} />
          </Button>

          <Button color="red" onClick={onLeave}>
            <IconPhoneOff stroke={1.5} size={16} />
          </Button>
        </>
      )}
    </Flex>
  );
}
