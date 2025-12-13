import { ActionIcon, Group, Image } from '@mantine/core'
import {
  IconArrowLeft,
  IconArrowRight,
  IconMinus,
  IconReload,
  IconTerminal2,
  IconWindowMinimize,
  IconX,
} from '@tabler/icons-react'
import { OUTER_TOOLBAR_HEIGHT } from '@/utils/constants'

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
      pl={5}
      pr={5}
    >
      {/* left group */}
      <Group gap={5}>
        <Image
          src="/favicon.svg"
          h={15}
          w="auto"
          fit="contain"
        />

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
