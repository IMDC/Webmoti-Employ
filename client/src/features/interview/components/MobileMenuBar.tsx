import { Group } from '@mantine/core'
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
    <Group justify="center" align="center" h="100%" px="md">
      <ToggleAudioButton onToggleMic={onToggleMic} />
      <ToggleVideoButton onToggleVideo={onToggleVideo} />
      <ToggleChatButton onToggleChat={onToggleChat} />
      <EndCallButton />
    </Group>
  )
}
