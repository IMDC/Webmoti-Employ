import { Avatar, Button, Flex, Group, ScrollArea, Space, Stack, Text } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import { useUser } from '@/features/auth/hooks/useUserStore'
import { useCommandChannelActions, useCommandChannelMessages } from './useCommandChannelStore'

function Caption({ message, isOwn }: { message: any, isOwn: boolean }) {
  const user = useUser()

  return (
    <Group>
      <Avatar src={isOwn ? user.image : undefined} />

      <Stack gap={0}>
        <Text>{isOwn ? 'You' : message.senderName || `User ${message.senderId}`}</Text>

        <Text>{message.text}</Text>
      </Stack>
    </Group>
  )
}

export function CaptionsArea() {
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const [testMessage, setTestMessage] = useState('')
  const { sendMessage } = useCommandChannelActions()
  const messages = useCommandChannelMessages()
  const user = useUser()

  useEffect(() => {
    const el = scrollViewportRef.current
    if (!el) {
      return
    }
    el.scrollTo({ top: el.scrollHeight, behavior: 'instant' })
  }, [messages])

  const handleSendTestMessage = async () => {
    if (testMessage.trim()) {
      await sendMessage(testMessage.trim())
      setTestMessage('')
    }
  }

  return (
    // TODO use react-virtual
    <ScrollArea
      viewportRef={scrollViewportRef}
      h="100%"
      px={{ base: 10, sm: 100 }}
      offsetScrollbars
    >
      <Flex
        h="100%"
        justify="flex-end"
        direction="column"
        gap="sm"
      >
        <Space h="xl" />
        <Space h="xl" />
        
        {/* Test Command Channel */}
        <Group>
          <Text size="sm" c="dimmed">Test Command Channel:</Text>
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Type a test message..."
            style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
            onKeyPress={(e) => e.key === 'Enter' && handleSendTestMessage()}
          />
          <Button size="xs" onClick={handleSendTestMessage} disabled={!testMessage.trim()}>
            Send
          </Button>
        </Group>

        {/* Command Channel Messages */}
        {messages.map((message, index) => (
          <Caption 
            key={message.msgid || index} 
            message={message} 
            isOwn={message.senderId === user.id} 
          />
        ))}
      </Flex>
    </ScrollArea>
  )
}
