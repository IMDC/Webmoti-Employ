import { Button, Indicator, Tooltip } from '@mantine/core'
import { IconMessageFilled } from '@tabler/icons-react'
import { useIsChatUnread } from '../../chat/useChatStore'

interface ToggleChatButtonProps {
  isChatOpen: boolean
  onToggleChat?: () => void
}

export function ToggleChatButton({ isChatOpen, onToggleChat }: ToggleChatButtonProps) {
  const isChatUnread = useIsChatUnread()

  return (
    <Indicator processing disabled={!isChatUnread}>
      <Tooltip label="Toggle chat" color="gray">
        <Button
          variant={isChatOpen ? 'filled' : 'default'}
          radius={isChatOpen ? 'sm' : 'xl'}
          onClick={onToggleChat}
          px={{ base: 'sm', sm: 'md' }}
          aria-label="Toggle chat"
          aria-pressed={isChatOpen}
        >
          <IconMessageFilled size={18} />
        </Button>
      </Tooltip>
    </Indicator>
  )
}
