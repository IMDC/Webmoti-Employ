import { Button, Flex, Group, Text } from '@mantine/core'
import { useCurrentTime } from '@/hooks/useCurrentTime'
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
  isChatOpen: boolean
  onToggleChat?: () => void
  onToggleLayoutModal?: () => void
  sendDevIsJohnDoNotUseThis?: (isJohn: boolean, isInterviewer: boolean) => void
  sendResetMessages?: () => void
}

export function MenuBar({
  onToggleMic,
  onToggleVideo,
  onToggleChat,
  isChatOpen,
  onToggleLayoutModal,
  sendDevIsJohnDoNotUseThis,
  sendResetMessages,
}: MenuBarProps) {
  const { switchCamera, switchMicrophone, switchSpeaker } = useZoomSessionActions()

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
          <ChangeAudioPopover switchMicrophone={switchMicrophone} switchSpeaker={switchSpeaker} />
          <ToggleAudioButton onToggleMic={onToggleMic} />
        </Button.Group>

        <Button.Group>
          <ChangeVideoPopover switchCamera={switchCamera} />
          <ToggleVideoButton onToggleVideo={onToggleVideo} />
        </Button.Group>
      </Flex>

      {/* right section */}
      <Flex align="center" gap="md" flex={1} justify="flex-end">
        <>
          <ToggleChatButton isChatOpen={isChatOpen} onToggleChat={onToggleChat} />

          <ControlsMenu onLayoutOpen={onToggleLayoutModal} sendDevIsJohnDoNotUseThis={sendDevIsJohnDoNotUseThis} sendResetMessages={sendResetMessages} />

          <EndCallButton />
        </>
      </Flex>
    </Flex>
  )
}
