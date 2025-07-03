import { useState } from 'react';
import { IconMessages, IconSend, IconTool, IconUserFilled } from '@tabler/icons-react';
import { ChatMessage, Participant } from '@zoom/videosdk';
import {
  ActionIcon,
  Box,
  Card,
  Flex,
  Group,
  ScrollArea,
  Space,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
} from '@mantine/core';
import { useZoomSessionStore } from '../zoom/useZoomSessionStore';
import { useChatStore } from './useChatStore';

function formatTo12HourTime(timestamp: number): string {
  const date = new Date(timestamp);
  let hours = date.getHours();
  const minutes = date.getMinutes();

  hours = hours % 12 || 12;
  const mins = minutes.toString().padStart(2, '0');

  return `${hours}:${mins}`;
}

type MessageProps = {
  chatMessage: ChatMessage;
  participants: Map<number, Participant>;
};

function Message({ chatMessage, participants }: MessageProps) {
  const { message, sender, timestamp } = chatMessage;
  const senderParticipant = participants.get(sender.userId);
  const isHost = senderParticipant?.isHost ?? false;

  return (
    <Flex justify="flex-start" align="center" direction="row" wrap="wrap">
      <Text c="dimmed" size="sm">
        {formatTo12HourTime(timestamp)}
      </Text>
      <Space w="xs" />

      <ThemeIcon size="sm" variant="light" mr={5}>
        {isHost ? <IconTool size={14} /> : <IconUserFilled size={14} />}
      </ThemeIcon>
      <Text fw="bolder" mr={5}>
        {sender.name}:
      </Text>
      <Text style={{ wordBreak: 'break-word' }}>{message}</Text>
    </Flex>
  );
}

export function Chat() {
  const [chatText, setChatText] = useState('');

  const messages = useChatStore((s) => s.messages);
  const sendChat = useChatStore((s) => s.sendChat);

  const participants = useZoomSessionStore((s) => s.participants);

  const isChatTextValid = chatText !== '';

  function sendMessage() {
    sendChat(chatText);
    setChatText('');
  }

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
      <Group>
        <IconMessages />
        <Text size="lg" fw={600}>
          Chat
        </Text>
      </Group>

      {/* message list */}
      <Box style={{ flex: 1, overflow: 'hidden', margin: '12px 0' }}>
        <ScrollArea style={{ height: '100%' }}>
          <Stack gap={2}>
            {messages.map((msg, i) => (
              <Message key={i} chatMessage={msg} participants={participants} />
            ))}
          </Stack>
        </ScrollArea>
      </Box>

      {/* input area */}
      <Textarea
        placeholder="Type a message..."
        value={chatText}
        onChange={(event) => setChatText(event.currentTarget.value)}
        minRows={2}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
          }
        }}
        rightSection={
          <ActionIcon variant="subtle" onClick={sendMessage} disabled={!isChatTextValid}>
            <IconSend stroke={1.5} />
          </ActionIcon>
        }
      />
    </Card>
  );
}
