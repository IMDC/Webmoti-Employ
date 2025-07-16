import { Group, Modal, Stack, Switch, Text } from '@mantine/core'
import { useAppStore } from '@/useAppStore'
import { ColorSchemeToggle } from './ColorSchemeToggle'

export function SettingsMenu() {
  const isSettingsOpened = useAppStore(state => state.isSettingsOpen)
  const setIsSettingsOpened = useAppStore(state => state.setIsSettingsOpen)
  const setIsColorblindModeOn = useAppStore(state => state.setIsColorblindModeOn)
  const isColorblindModeOn = useAppStore(state => state.isColorblindModeOn)

  return (
    <Modal
      opened={isSettingsOpened}
      onClose={() => setIsSettingsOpened(false)}
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
