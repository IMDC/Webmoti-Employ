import { useState } from 'react';
import { IconFile, IconSend } from '@tabler/icons-react';
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

function Message() {
  return (
    <Group align="flex-start">
      <Avatar />

      <Stack gap={2} flex={1}>
        <Group align="flex-end" gap={10}>
          <Text fw={500}>Joe</Text>
          <Text fz="xs" c="dimmed">
            11:00 AM
          </Text>
        </Group>

        <Paper p="xs" fz="sm" style={{ wordBreak: 'break-word' }}>
          aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        </Paper>
      </Stack>
    </Group>
  );
}

export function Chat() {
  const theme = useMantineTheme();
  const [file, setFile] = useState<File | null>(null);
  const [chatText, setChatText] = useState('');

  function sendMessage() {
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
            {Array.from({ length: 10 }).map((_, i) => (
              <Message key={i} />
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
            <ActionIcon variant="subtle" onClick={sendMessage}>
              <IconSend stroke={1.5} size="lg" />
            </ActionIcon>
          }
        />
      </Stack>
    </Card>
  );
}
