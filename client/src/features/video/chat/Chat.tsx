import { useState } from 'react';
import { IconFile, IconSend } from '@tabler/icons-react';
import { ChatMessage } from '@zoom/videosdk';
import {
  ActionIcon,
  Avatar,
  Box,
  Card,
  FileButton,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  useMantineTheme,
} from '@mantine/core';
import { MyEmojiPicker } from './MyEmojiPicker';
import { useChatStore } from './useChatStore';

function formatRelativeTime(timestamp: number) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diff = Date.now() - new Date(timestamp).getTime();

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) {
    return rtf.format(-seconds, 'second');
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return rtf.format(-minutes, 'minute');
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return rtf.format(-hours, 'hour');
  }

  const days = Math.floor(hours / 24);
  return rtf.format(-days, 'day');
}

function Message({ message, sender, timestamp }: ChatMessage) {
  return (
    <Group align="flex-start">
      <Avatar />

      <Stack gap={2} flex={1}>
        <Group align="flex-end" gap={10}>
          <Text fw={500}>{sender.name}</Text>
          <Text fz="xs" c="dimmed">
            {formatRelativeTime(timestamp)}
          </Text>
        </Group>

        <Paper p="xs" fz="sm" style={{ wordBreak: 'break-word' }}>
          {message}
        </Paper>
      </Stack>
    </Group>
  );
}

export function Chat() {
  const theme = useMantineTheme();
  const [_, setFile] = useState<File | null>(null);
  const [chatText, setChatText] = useState('');

  const messages = useChatStore((s) => s.messages);
  const sendChat = useChatStore((s) => s.sendChat);

  const isChatTextValid = chatText !== ""

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
        borderTopLeftRadius: theme.radius.md,
        borderBottomLeftRadius: theme.radius.md,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      }}
    >
      {/* header */}
      <Text size="lg" fw={600}>
        Chat
      </Text>

      {/* message list */}
      <Box style={{ flex: 1, overflow: 'hidden', margin: '12px 0' }}>
        <ScrollArea style={{ height: '100%' }}>
          <Stack>
            {Array.from(messages).map((chatMessage, i) => (
              <Message key={i} {...chatMessage} />
            ))}
          </Stack>
        </ScrollArea>
      </Box>

      {/* input area */}
      <Stack gap={5}>
        <Group gap={5}>
          <FileButton onChange={setFile} accept="image/png,image/jpeg">
            {(props) => (
              <ActionIcon {...props} size="sm" variant="subtle">
                <IconFile stroke={1.5} />
              </ActionIcon>
            )}
          </FileButton>

          <MyEmojiPicker addEmoji={(emojiString) => setChatText((prev) => prev + emojiString)} />
        </Group>

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
      </Stack>
    </Card>
  );
}
