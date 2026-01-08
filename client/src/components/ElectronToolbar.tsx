import { ActionIcon, Group, Image, Space, Text } from '@mantine/core'
import {
  IconArrowLeft,
  IconArrowRight,
  IconReload,
  IconTerminal2,
} from '@tabler/icons-react'
import { HEADER_SIDE_PADDING, OUTER_TOOLBAR_HEIGHT } from '@/utils/constants'

function ToolbarIcon({
  icon: IconComponent,
  action,
}: {
  icon: React.ElementType
  action: () => void
}) {
  return (
    <ActionIcon
      variant="subtle"
      onClick={action}
      style={{ WebkitAppRegion: 'no-drag' }}
    >
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
      style={{
        // make the whole header draggable
        WebkitAppRegion: 'drag',
      }}
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

        {/* need to use arrow wrapper here to avoid electron clone error */}
        <ToolbarIcon icon={IconArrowLeft} action={() => window.electron.goBackWindow()} />
        <ToolbarIcon icon={IconArrowRight} action={() => window.electron.goForwardWindow()} />
        <ToolbarIcon icon={IconReload} action={() => window.electron.reloadWindow()} />
        <ToolbarIcon icon={IconTerminal2} action={() => window.electron.toggleConsoleWindow()} />
      </Group>
    </Group>
  )
}
