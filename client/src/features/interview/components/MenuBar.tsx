import { Button, Flex, Group, Text } from '@mantine/core'
import { useCurrentTime } from '@/hooks/useCurrentTime'
import { ToggleCaptionsButton } from '../captions/ToggleCaptionsButton'
import { ControlsMenu } from '../session/components/ControlsMenu'
import { useZoomSessionActions } from '../zoom/useZoomSessionStore'
import { EndCallButton } from './buttons/EndCallButton'
import { ToggleAudioButton } from './buttons/ToggleAudioButton'
import { ToggleChatButton } from './buttons/ToggleChatButton'
import { ToggleVideoButton } from './buttons/ToggleVideoButton'
import { ChangeAudioPopover } from './popovers/ChangeAudioPopover'
import { ChangeVideoPopover } from './popovers/ChangeVideoPopover'

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

  const { switchCamera, switchMicrophone } = useZoomSessionActions()

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
          <ChangeAudioPopover switchMicrophone={switchMicrophone} />
          <ToggleAudioButton onToggleMic={onToggleMic} />
        </Button.Group>

        <Button.Group>
          <ChangeVideoPopover switchCamera={switchCamera} />
          <ToggleVideoButton onToggleVideo={onToggleVideo} />
        </Button.Group>

        <ToggleCaptionsButton
          isCaptionsAreaOpen={isCaptionsAreaOpen}
          toggleCaptionsArea={toggleCaptionsArea}
        />
      </Flex>

      {/* right section */}
      <Flex align="center" gap="md" flex={1} justify="flex-end">
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
