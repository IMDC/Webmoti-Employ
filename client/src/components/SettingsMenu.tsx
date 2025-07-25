import { Group, Modal, Stack, Switch, Text } from '@mantine/core'
import { useAppActions, useAppIsColorblindModeOn, useAppIsSettingsOpen } from '@/useAppStore'
import { ColorSchemeToggle } from './ColorSchemeToggle'

export function SettingsMenu() {
  const isSettingsOpened = useAppIsSettingsOpen()
  const { setIsSettingsOpen, setIsColorblindModeOn } = useAppActions()
  const isColorblindModeOn = useAppIsColorblindModeOn()

  return (
    <Modal
      opened={isSettingsOpened}
      onClose={() => setIsSettingsOpen(false)}
      title={<Text fw="bolder">Settings</Text>}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack>
        <Switch
          label="Colour blind mode"
          checked={isColorblindModeOn}
          onChange={event => setIsColorblindModeOn(event.currentTarget.checked)}
        />
        <Group>
          <Text>Change theme</Text>
          <ColorSchemeToggle />
        </Group>
      </Stack>
    </Modal>
  )
}
