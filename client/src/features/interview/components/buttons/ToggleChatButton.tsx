import { Button, Indicator } from '@mantine/core'
import { IconMessageFilled } from '@tabler/icons-react'
import { useChatStore } from '../../chat/useChatStore'

interface ToggleChatButtonProps {
  onToggleChat?: () => void
}

export function ToggleChatButton({ onToggleChat }: ToggleChatButtonProps) {
  const isChatUnread = useChatStore(s => s.isChatUnread)

  return (
    <Indicator processing disabled={!isChatUnread}>
      <Button variant="default" onClick={onToggleChat}>
        <IconMessageFilled size={18} />
      </Button>
    </Indicator>
  )
}
