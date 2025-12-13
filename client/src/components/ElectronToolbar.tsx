import { ActionIcon, Group, Image, Space, Text } from '@mantine/core'
import {
  IconArrowLeft,
  IconArrowRight,
  IconMinus,
  IconReload,
  IconTerminal2,
  IconWindowMinimize,
  IconX,
} from '@tabler/icons-react'
import { HEADER_SIDE_PADDING, OUTER_TOOLBAR_HEIGHT } from '@/utils/constants'

function ToolbarIcon({ icon: IconComponent }: { icon: React.ElementType }) {
  return (
    <ActionIcon variant="subtle">
      <IconComponent style={{ height: 20 }} stroke={1.5} />
    </ActionIcon>
  )
}

export function ElectronToolbar() {
  return (
    <Group
      justify="space-between"
      align="center"
      h={OUTER_TOOLBAR_HEIGHT}
      pl={HEADER_SIDE_PADDING}
      pr={HEADER_SIDE_PADDING}
    >
      {/* left group */}
      <Group gap={5}>
        <Image
          src="/favicon.svg"
          h={15}
          w="auto"
          fit="contain"
        />
        <Text
          fz={15}
          fw={900}
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          draggable={false}
        >
          WebMoti-Employ
        </Text>

        <Space w="xs" />

        <ToolbarIcon icon={IconArrowLeft} />
        <ToolbarIcon icon={IconArrowRight} />
        <ToolbarIcon icon={IconReload} />
        <ToolbarIcon icon={IconTerminal2} />
      </Group>

      {/* right group */}
      <Group>
        <ToolbarIcon icon={IconMinus} />
        <ToolbarIcon icon={IconWindowMinimize} />
        <ToolbarIcon icon={IconX} />
      </Group>
    </Group>
  )
}
