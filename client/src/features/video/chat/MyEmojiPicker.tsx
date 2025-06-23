import { useState } from 'react';
import { IconMoodHappy } from '@tabler/icons-react';
import { EmojiPicker } from 'frimousse';
import { ActionIcon, Popover } from '@mantine/core';

type Emoji = {
  emoji: string;
  label: string;
};

interface MyEmojiPicker {
  addEmoji: (emojiString: string) => void;
}

export function MyEmojiPicker({ addEmoji }: MyEmojiPicker) {
  const [opened, setOpened] = useState(false);

  function handleEmojiSelect({ emoji }: Emoji) {
    addEmoji(emoji);
    setOpened(false);
  }

  return (
    <Popover opened={opened} onChange={setOpened}>
      <Popover.Target>
        <ActionIcon size="sm" variant="subtle" onClick={() => setOpened((o) => !o)}>
          <IconMoodHappy stroke={1.5} />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown>
        <EmojiPicker.Root onEmojiSelect={handleEmojiSelect}>
          <EmojiPicker.Search />
          <EmojiPicker.Viewport>
            <EmojiPicker.Loading>Loading…</EmojiPicker.Loading>
            <EmojiPicker.Empty>No emoji found.</EmojiPicker.Empty>
            <EmojiPicker.List />
          </EmojiPicker.Viewport>
        </EmojiPicker.Root>
      </Popover.Dropdown>
    </Popover>
  );
}
