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
import { useAppStore } from '@/stores/useAppStore';
import { ChangeLayoutModal } from '../session/components/ChangeLayoutModal/ChangeLayoutModal';
import { ControlsMenu } from '../session/components/ControlsMenu';
import { ChangeMediaDevice } from './ChangeMediaDevice';

interface MenuBarProps {
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleChat?: () => void;
  isPrejoin?: boolean;
  disableMediaButtons?: boolean;
  onLeave?: () => void;

  onChangeVideoDevice?: (videoDeviceId: string) => Promise<void>;
  onChangeAudioInputDevice?: (audioInputDeviceId: string) => Promise<void>;
}

export function MenuBar({
  onToggleMic,
  onToggleVideo,
  onToggleChat,
  onChangeVideoDevice,
  onChangeAudioInputDevice,
  isPrejoin = false,
  disableMediaButtons = false,
  onLeave,
}: MenuBarProps) {
  const permissionState = useAppStore((state) => state.permissionState);
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
            <ChangeMediaDevice
              mediaType="audio"
              variant="radio"
              onSwitchMicrophone={onChangeAudioInputDevice}
            />
          </Popover.Dropdown>
        </Popover>

        {permissionState === 'denied' ? (
          <Indicator color="orange">{MicButton}</Indicator>
        ) : (
          MicButton
        )}
      </Button.Group>

      <Button.Group>
        <Popover>
          <Popover.Target>
            <Button variant="default" disabled={disableMediaButtons}>
              <IconChevronUp stroke={1.5} size={16} />
            </Button>
          </Popover.Target>

          <Popover.Dropdown>
            <ChangeMediaDevice
              mediaType="video"
              variant="radio"
              onSwitchCamera={onChangeVideoDevice}
            />
          </Popover.Dropdown>
        </Popover>

        {permissionState === 'denied' ? (
          <Indicator color="orange">{VideoButton}</Indicator>
        ) : (
          VideoButton
        )}
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
