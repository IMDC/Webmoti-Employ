import { Button, Flex, Group, Popover, Text } from '@mantine/core'
import { IconChevronUp } from '@tabler/icons-react'
import { useCurrentTime } from '@/hooks/useCurrentTime'
import { useAppStore } from '@/useAppStore'
import { ToggleCaptionsButton } from '../captions/ToggleCaptionsButton'
import { ControlsMenu } from '../session/components/ControlsMenu'
import { useZoomSessionStore } from '../zoom/useZoomSessionStore'
import { EndCallButton } from './buttons/EndCallButton'
import { ToggleAudioButton } from './buttons/ToggleAudioButton'
import { ToggleChatButton } from './buttons/ToggleChatButton'
import { ToggleVideoButton } from './buttons/ToggleVideoButton'
import { ChangeMediaDevice } from './ChangeMediaDevice'

interface MenuBarProps {
  onToggleMic: () => Promise<void>
  onToggleVideo: () => Promise<void>
  isCaptionsAreaOpen: boolean
  toggleCaptionsArea: () => void
  isChatOpen: boolean
  onToggleChat?: () => void
}

export function MenuBar({
  onToggleMic,
  onToggleVideo,
  onToggleChat,
  isChatOpen,
  isCaptionsAreaOpen,
  toggleCaptionsArea,
}: MenuBarProps) {
  // const [isLayoutModalOpen, { open: openLayoutModal, close: closeLayoutModal }]
  //   = useDisclosure(false)

  const switchCamera = useZoomSessionStore(s => s.switchCamera)
  const switchMicrophone = useZoomSessionStore(s => s.switchMicrophone)

  const permissionState = useAppStore(s => s.permissionState)
  const disableMediaButtons = permissionState === 'idle' || permissionState === 'acquiring'

  const time = useCurrentTime()

  return (
    <Flex justify="center" align="center" h="100%" px="md">
      {/* left section */}
      <Group flex={1}>
        <Text ff="monospace">
          {time}
        </Text>
      </Group>

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
                onSwitchMicrophone={switchMicrophone}
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
                onSwitchCamera={switchCamera}
              />
            </Popover.Dropdown>
          </Popover>

          <ToggleVideoButton onToggleVideo={onToggleVideo} />

        </Button.Group>

        <ToggleCaptionsButton
          isCaptionsAreaOpen={isCaptionsAreaOpen}
          toggleCaptionsArea={toggleCaptionsArea}
        />
      </Flex>

      {/* right section */}
      <Flex align="center" gap="md" style={{ flex: 1 }} justify="flex-end">
        <>
          <ToggleChatButton isChatOpen={isChatOpen} onToggleChat={onToggleChat} />

          <ControlsMenu />

          <EndCallButton />
          {/* <ChangeLayoutModal isOpen={isLayoutModalOpen} onClose={closeLayoutModal} /> */}
        </>
      </Flex>
    </Flex>
  )
}
