import type { ProfilesResponse } from '@webmoti-employ/shared'
import type { ChatMessage, Participant } from '@zoom/videosdk'
import {
  ActionIcon,
  Box,
  Card,
  Flex,
  Group,
  ScrollArea,
  Skeleton,
  Text,
  Textarea,
  ThemeIcon,
} from '@mantine/core'
import { IconMessages, IconSend, IconTool, IconUserFilled, IconX } from '@tabler/icons-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import Linkify from 'linkify-react'
import { DateTime } from 'luxon'
import { useEffect, useRef, useState } from 'react'
import { isElectron } from '@/utils/utils'
import { useZoomParticipants } from '../zoom/useZoomSessionStore'
import { useChatActions, useChatMessages } from './useChatStore'

interface MessageProps {
  chatMessage: ChatMessage
  participants: Map<number, Participant>
  isLoadingProfiles: boolean
  profiles?: ProfilesResponse
}

function Message({ chatMessage, participants, profiles, isLoadingProfiles }: MessageProps) {
  const { message, sender, timestamp } = chatMessage
  const senderParticipant = participants.get(sender.userId)
  const isHost = senderParticipant?.isHost ?? false

  const displayName = (profiles && profiles[sender.name]?.displayName) || sender.name

  return (
    <Flex gap={5}>
      <Text c="dimmed" size="sm" mb={10}>
        {DateTime.fromMillis(timestamp).toFormat('h:mm')}
      </Text>

      <ThemeIcon size="sm" variant="light">
        {isHost ? <IconTool size={14} /> : <IconUserFilled size={14} />}
      </ThemeIcon>

      <Skeleton visible={isLoadingProfiles}>
        <Text
          lh="xs"
          style={{ overflowWrap: 'anywhere' }}
        >
          <strong style={{ marginRight: 5 }}>
            {displayName}
          </strong>
          <Linkify options={{
            target: '_blank',
            rel: 'noopener noreferrer',
            attributes: isElectron()
              ? {
                  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
                    event.preventDefault()
                    const href = event.currentTarget.href
                    if (href) {
                      window.electron.openExternalUrl(href)
                    }
                  },
                }
              : undefined,
          }}
          >
            {message}
          </Linkify>
        </Text>
      </Skeleton>
    </Flex>
  )
}

interface ChatProps {
  onClose: () => void
  isLoadingProfiles: boolean
  profiles?: ProfilesResponse
}

export function Chat({ onClose, profiles, isLoadingProfiles }: ChatProps) {
  const [chatText, setChatText] = useState('')
  const [isAtBottom, setIsAtBottom] = useState(true)

  const messages = useChatMessages()
  const { sendChat, setChatRead } = useChatActions()

  const participants = useZoomParticipants()

  const scrollViewportRef = useRef<HTMLDivElement>(null)

  const isChatTextValid = chatText.trim() !== ''

  function sendMessage() {
    const trimmed = chatText.trim()
    sendChat(trimmed)
    setChatText('')
  }

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollViewportRef.current,
    estimateSize: () => 35,
    overscan: 5,
  })

  const items = rowVirtualizer.getVirtualItems()

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
      h="100%"
      p={16}
      display="flex"
      style={{ flexDirection: 'column' }}
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

        <ActionIcon variant="subtle" onClick={onClose} aria-label="Close chat">
          <IconX />
        </ActionIcon>
      </Group>

      {/* message list */}
      <Box flex={1} my={12} style={{ overflow: 'hidden' }}>
        <ScrollArea
          h="100%"
          viewportRef={scrollViewportRef}
          onScrollPositionChange={handleScroll}
          offsetScrollbars
        >
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${items[0]?.start ?? 0}px)`,
              }}
            >
              {items.map(virtualRow => (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{ width: '100%' }}
                >
                  <Message
                    chatMessage={messages[virtualRow.index]}
                    participants={participants}
                    profiles={profiles}
                    isLoadingProfiles={isLoadingProfiles}
                  />
                </div>
              ))}
            </div>
          </div>
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
          <ActionIcon variant="subtle" onClick={sendMessage} disabled={!isChatTextValid} aria-label="Send message">
            <IconSend stroke={1.5} />
          </ActionIcon>
        )}
      />
    </Card>
  )
}
