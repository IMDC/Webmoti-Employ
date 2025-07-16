import type { ChatMessage, Participant } from '@zoom/videosdk'
import {
  ActionIcon,
  Box,
  Card,
  Flex,
  Group,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
} from '@mantine/core'
import { IconMessages, IconSend, IconTool, IconUserFilled, IconX } from '@tabler/icons-react'
import Linkify from 'linkify-react'
import { DateTime } from 'luxon'
import { useEffect, useRef, useState } from 'react'
import { useZoomSessionStore } from '../zoom/useZoomSessionStore'
import { useChatStore } from './useChatStore'

interface MessageProps {
  chatMessage: ChatMessage
  participants: Map<number, Participant>
}

function Message({ chatMessage, participants }: MessageProps) {
  const { message, sender, timestamp } = chatMessage
  const senderParticipant = participants.get(sender.userId)
  const isHost = senderParticipant?.isHost ?? false

  return (
    <Flex gap={5}>
      <Text c="dimmed" size="sm">
        {DateTime.fromMillis(timestamp).toFormat('h:mm')}
      </Text>

      <ThemeIcon size="sm" variant="light">
        {isHost ? <IconTool size={14} /> : <IconUserFilled size={14} />}
      </ThemeIcon>

      <Text
        lh="xs"
        style={{
          overflowWrap: 'anywhere',
        }}
      >
        <strong style={{ marginRight: 5 }}>
          {sender.name}
          :
        </strong>
        <Linkify>{message}</Linkify>
      </Text>
    </Flex>
  )
}

interface ChatProps {
  onClose: () => void
}

export function Chat({ onClose }: ChatProps) {
  const [chatText, setChatText] = useState('')
  const [isAtBottom, setIsAtBottom] = useState(true)

  const messages = useChatStore(s => s.messages)
  const sendChat = useChatStore(s => s.sendChat)
  const setChatRead = useChatStore(s => s.setChatRead)

  const participants = useZoomSessionStore(s => s.participants)

  const scrollViewportRef = useRef<HTMLDivElement>(null)

  const isChatTextValid = chatText.trim() !== ''

  function sendMessage() {
    const trimmed = chatText.trim()
    sendChat(trimmed)
    setChatText('')
  }

  const handleScroll = ({ y }: { x: number, y: number }) => {
    const el = scrollViewportRef.current
    if (!el) {
      return
    }
    const SCROLL_EPSILON = 5
    setIsAtBottom(y + el.clientHeight >= el.scrollHeight - SCROLL_EPSILON)
  }

  useEffect(() => {
    const el = scrollViewportRef.current
    if (!el) {
      return
    }
    // scroll to bottom when you open the chat
    el.scrollTo({ top: el.scrollHeight, behavior: 'instant' })
  }, [])

  useEffect(() => {
    const el = scrollViewportRef.current
    if (!el || !isAtBottom) {
      return
    }
    // when you're at the bottom, mark as read and scroll down to the new message
    setChatRead()
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, isAtBottom, setChatRead])

  return (
    <Card
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 16,
      }}
      withBorder
    >
      {/* header */}
      <Group justify="space-between">
        <Group>
          <IconMessages />
          <Text size="lg" fw={600}>
            Chat
          </Text>
        </Group>

        <ActionIcon variant="subtle" onClick={onClose}>
          <IconX />
        </ActionIcon>
      </Group>

      {/* message list */}
      <Box style={{ flex: 1, overflow: 'hidden', margin: '12px 0' }}>
        <ScrollArea
          style={{ height: '100%' }}
          viewportRef={scrollViewportRef}
          onScrollPositionChange={handleScroll}
        >
          <Stack gap={5}>
            {messages.map(msg => (
              <Message key={msg.id} chatMessage={msg} participants={participants} />
            ))}
          </Stack>
        </ScrollArea>
      </Box>

      {/* input area */}
      <Textarea
        placeholder="Type a message..."
        value={chatText}
        onChange={event => setChatText(event.currentTarget.value)}
        minRows={2}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            if (!isChatTextValid) {
              return
            }
            sendMessage()
          }
        }}
        rightSection={(
          <ActionIcon variant="subtle" onClick={sendMessage} disabled={!isChatTextValid}>
            <IconSend stroke={1.5} />
          </ActionIcon>
        )}
      />
    </Card>
  )
}
