import { Group, Modal, Radio, Stack, Text } from '@mantine/core'
import {
  IconLayoutGrid,
  IconSquare,
} from '@tabler/icons-react'
import classes from './ChangeLayoutModal.module.css'

const layouts = [
  // TODO: implement Auto mode
  // {
  //   value: 'auto',
  //   label: 'Auto',
  //   description: 'Automatically selects the best layout.',
  //   icon: IconLayoutDashboard,
  // },
  {
    value: 'spotlight',
    label: 'Spotlight',
    description: 'Emphasizes the active speaker.',
    icon: IconSquare,
  },
  {
    value: 'grid',
    label: 'Grid',
    description: 'Displays all participants equally in a grid.',
    icon: IconLayoutGrid,
  },
  // TODO: implement Sidebar mode
  // {
  //   value: 'sidebar',
  //   label: 'Sidebar',
  //   description: 'Main view with participants in a side panel.',
  //   icon: IconLayoutSidebarRight,
  // },
] as const

export type LayoutValue = typeof layouts[number]['value']

interface ChangeLayoutModalProps {
  layout: string
  onChangeLayout: (val: LayoutValue) => void
  isOpen: boolean
  onClose: () => void
}

export function ChangeLayoutModal({ isOpen, onClose, layout, onChangeLayout }: ChangeLayoutModalProps) {
  const cards = layouts.map(layout => (
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
  ))

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Select Layout"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <Radio.Group
        value={layout}
        onChange={(val: string) => onChangeLayout(val as LayoutValue)}
        name="layout"
      >
        <Stack pt="md" gap="xs">
          {cards}
        </Stack>
      </Radio.Group>
    </Modal>
  )
}
