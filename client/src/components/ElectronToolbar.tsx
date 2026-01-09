import { ActionIcon, em, Group, Image, Space, Text, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconArrowLeft,
  IconArrowRight,
  IconReload,
  IconTerminal2,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { HEADER_SIDE_PADDING, OUTER_TOOLBAR_HEIGHT } from '@/utils/constants'
import { isElectron } from '@/utils/utils'

function ToolbarIcon({
  icon: IconComponent,
  action,
  disabled,
}: {
  icon: React.ElementType
  action: () => void
  disabled?: boolean
}) {
  return (
    <ActionIcon
      variant="subtle"
      onClick={disabled ? undefined : action}
      style={{
        WebkitAppRegion: 'no-drag',

      }}
      // custom styles to not show background when disabled
      styles={{
        root: {
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'default' : 'pointer',
          backgroundColor: disabled ? 'transparent' : undefined,
        },
      }}
    >
      <IconComponent style={{ height: 20 }} stroke={1.5} />
    </ActionIcon>
  )
}

export function ElectronToolbar() {
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${em(theme.breakpoints.sm)})`)

  useEffect(() => {
    if (!isElectron()) {
      return
    }
    return window.electron.subscribeToNavigation((state: NavigationState) => {
      setCanGoBack(state.canGoBack)
      setCanGoForward(state.canGoForward)
    })
  }, [])

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
        {!isMobile && (
          <Text
            fz={15}
            fw={900}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          >
            WebMoti-Employ
          </Text>
        )}

        <Space w="xs" />

        {/* need to use arrow wrapper here to avoid electron clone error */}
        <ToolbarIcon icon={IconArrowLeft} action={() => window.electron.goBackWindow()} disabled={!canGoBack} />
        <ToolbarIcon icon={IconArrowRight} action={() => window.electron.goForwardWindow()} disabled={!canGoForward} />
        <ToolbarIcon icon={IconReload} action={() => window.electron.reloadWindow()} />
        <ToolbarIcon icon={IconTerminal2} action={() => window.electron.toggleConsoleWindow()} />
      </Group>
    </Group>
  )
}
