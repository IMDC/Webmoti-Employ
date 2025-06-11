import {
  IconInfoCircle,
  IconMenu2,
  IconScreenShare,
  IconSettings,
  IconSpeakerphone,
} from '@tabler/icons-react';
import { Button, Menu } from '@mantine/core';

export function ControlsMenu() {
  return (
    <Menu shadow="md">
      <Menu.Target>
        <Button variant="default">
          <IconMenu2 stroke={1.5} size={16} />
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Controls</Menu.Label>

        <Menu.Item leftSection={<IconSpeakerphone size={14} />}>Speaker View</Menu.Item>

        <Menu.Item leftSection={<IconScreenShare size={14} />}>Share Screen</Menu.Item>

        <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>

        <Menu.Item leftSection={<IconInfoCircle size={14} />}>About</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
