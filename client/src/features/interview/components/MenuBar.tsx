import { Button, Flex, Popover } from '@mantine/core'
import { IconChevronUp } from '@tabler/icons-react'
import { useAppStore } from '@/useAppStore'
import { ControlsMenu } from '../session/components/ControlsMenu'
import { EndCallButton } from './buttons/EndCallButton'
import { ToggleAudioButton } from './buttons/ToggleAudioButton'
import { ToggleChatButton } from './buttons/ToggleChatButton'
import { ToggleVideoButton } from './buttons/ToggleVideoButton'
import { ChangeMediaDevice } from './ChangeMediaDevice'

interface MenuBarProps {
  onToggleMic: () => Promise<void>
  onToggleVideo: () => Promise<void>
  onToggleChat?: () => void
  isPrejoin?: boolean
  onChangeVideoDevice?: (videoDeviceId: string) => Promise<void>
  onChangeAudioInputDevice?: (audioInputDeviceId: string) => Promise<void>
}

export function MenuBar({
  onToggleMic,
  onToggleVideo,
  onToggleChat,
  onChangeVideoDevice,
  onChangeAudioInputDevice,
  isPrejoin = false,
}: MenuBarProps) {
  // const [isLayoutModalOpen, { open: openLayoutModal, close: closeLayoutModal }]
  //   = useDisclosure(false)

  const permissionState = useAppStore(s => s.permissionState)
  const disableMediaButtons = permissionState === 'idle' || permissionState === 'acquiring'

  return (
    <Flex justify="center" align="center" h="100%" px="md">
      {/* left section */}
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

          <ToggleAudioButton onToggleMic={onToggleMic} />
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

          <ToggleVideoButton onToggleVideo={onToggleVideo} />
        </Button.Group>
      </Flex>

      {/* right section */}
      <Flex align="center" gap="md" style={{ flex: 1 }} justify="flex-end">
        {!isPrejoin && (
          <>
            <ToggleChatButton onToggleChat={onToggleChat} />

            <ControlsMenu />

            {!isPrejoin && (
              <EndCallButton />
            )}
            {/* <ChangeLayoutModal isOpen={isLayoutModalOpen} onClose={closeLayoutModal} /> */}
          </>
        )}
      </Flex>
    </Flex>
  )
}
