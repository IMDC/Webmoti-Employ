import { useState } from 'react';
import {
  IconLayoutDashboard,
  IconLayoutGrid,
  IconLayoutSidebarRight,
  IconSquare,
} from '@tabler/icons-react';
import { Group, Modal, Radio, Stack, Text } from '@mantine/core';
import classes from './ChangeLayoutModal.module.css';

interface ChangeLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const layouts = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Automatically selects the best layout.',
    icon: IconLayoutDashboard,
  },
  {
    value: 'grid',
    label: 'Grid',
    description: 'Displays all participants equally in a grid.',
    icon: IconLayoutGrid,
  },
  {
    value: 'spotlight',
    label: 'Speaker',
    description: 'Emphasizes the active speaker.',
    icon: IconSquare,
  },
  {
    value: 'sidebar',
    label: 'Sidebar',
    description: 'Main view with participants in a side panel.',
    icon: IconLayoutSidebarRight,
  },
];

export function ChangeLayoutModal({ isOpen, onClose }: ChangeLayoutModalProps) {
  const [value, setValue] = useState<string | null>('auto');

  const cards = layouts.map((layout) => (
    <Radio.Card key={layout.value} value={layout.value} radius="md" className={classes.root}>
      <Group wrap="nowrap" align="flex-start">
        <Radio.Indicator />
        <layout.icon size={24} style={{ marginTop: 4, marginLeft: 4, marginRight: 8 }} />
        <div>
          <Text className={classes.label}>{layout.label}</Text>
          <Text className={classes.description}>{layout.description}</Text>
        </div>
      </Group>
    </Radio.Card>
  ));

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Select Layout"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <Radio.Group value={value} onChange={setValue} name="layout">
        <Stack pt="md" gap="xs">
          {cards}
        </Stack>
      </Radio.Group>
    </Modal>
  );
}
