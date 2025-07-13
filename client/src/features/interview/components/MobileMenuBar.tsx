import { Group } from '@mantine/core'
import { ControlsMenu } from '../session/components/ControlsMenu'
import { EndCallButton } from './buttons/EndCallButton'
import { ToggleAudioButton } from './buttons/ToggleAudioButton'
import { ToggleChatButton } from './buttons/ToggleChatButton'
import { ToggleVideoButton } from './buttons/ToggleVideoButton'

interface MobileMenuBarProps {
  onToggleMic: () => Promise<void>
  onToggleVideo: () => Promise<void>
  onToggleChat?: () => void
}

export function MobileMenuBar({
  onToggleMic,
  onToggleVideo,
  onToggleChat,
}: MobileMenuBarProps) {
  return (
    <Group justify="center" align="center" h="100%" gap="sm">
      <ToggleAudioButton onToggleMic={onToggleMic} />
      <ToggleVideoButton onToggleVideo={onToggleVideo} />
      <ToggleChatButton onToggleChat={onToggleChat} />
      <ControlsMenu isMobile />
      <EndCallButton />
    </Group>
  )
}
