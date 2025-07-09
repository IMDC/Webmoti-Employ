import {
  IconChevronUp,
  IconMessageFilled,
  IconMicrophoneFilled,
  IconMicrophoneOff,
  IconPhoneOff,
  IconVideoFilled,
  IconVideoOff,
} from '@tabler/icons-react';
import { Button, Flex, Indicator, Popover } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAppStore } from '@/useAppStore';
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
  isChatUnread?: boolean;
  onChangeVideoDevice?: (videoDeviceId: string) => Promise<void>;
  onChangeAudioInputDevice?: (audioInputDeviceId: string) => Promise<void>;
}

export function MenuBar({
  onToggleMic,
  onToggleVideo,
  onToggleChat,
  onChangeVideoDevice,
  onChangeAudioInputDevice,
  onLeave,
  isPrejoin = false,
  disableMediaButtons = false,
  isChatUnread = false,
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
        <IconMicrophoneFilled size={18} />
      ) : (
        <IconMicrophoneOff size={18} style={{ fill: 'white' }} />
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
      {isVideoOn ? (
        <IconVideoFilled size={18} />
      ) : (
        <IconVideoOff style={{ fill: 'white' }} size={18} />
      )}
    </Button>
  );

  return (
    <Flex justify="center" align="center" h="100%" px="md">
      <div style={{ flex: 1 }} />

      {/* center section */}
      <Flex align="center" gap="md">
        <Button.Group>
          <Popover>
            <Popover.Target>
              <Button variant="default" disabled={disableMediaButtons} px="xs">
                <IconChevronUp size={18} />
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

          <Indicator color="orange" disabled={permissionState !== 'denied'}>
            {MicButton}
          </Indicator>
        </Button.Group>

        <Button.Group>
          <Popover>
            <Popover.Target>
              <Button variant="default" disabled={disableMediaButtons} px="xs">
                <IconChevronUp size={18} />
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

          <Indicator color="orange" disabled={permissionState !== 'denied'}>
            {VideoButton}
          </Indicator>
        </Button.Group>

        {!isPrejoin && (
          <Button color="red" onClick={onLeave}>
            <IconPhoneOff size={18} style={{ fill: 'white' }} />
          </Button>
        )}
      </Flex>

      {/* right section */}
      <Flex align="center" gap="md" style={{ flex: 1 }} justify="flex-end">
        {!isPrejoin && (
          <>
            <Indicator processing disabled={!isChatUnread}>
              <Button variant="default" onClick={onToggleChat}>
                <IconMessageFilled size={18} />
              </Button>
            </Indicator>

            <ControlsMenu onLayoutOpen={openLayoutModal} />
            <ChangeLayoutModal isOpen={isLayoutModalOpen} onClose={closeLayoutModal} />
          </>
        )}
      </Flex>
    </Flex>
  );
}
