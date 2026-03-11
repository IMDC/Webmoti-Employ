import { Button, Group, Modal, Stack, Switch, Text, TextInput } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useUpdateDisplayName } from '@/features/auth/hooks/useUpdateDisplayName'
import { useAppActions, useAppIsColorblindModeOn, useAppIsSettingsOpen } from '@/useAppStore'
import { AboutModal } from './AboutModal'
import { ColorSchemeToggle } from './ColorSchemeToggle'

export function SettingsMenu() {
  const isSettingsOpened = useAppIsSettingsOpen()
  const { setIsSettingsOpen, setIsColorblindModeOn } = useAppActions()
  const isColorblindModeOn = useAppIsColorblindModeOn()

  const { displayName, setDisplayName, isSaving, isChanged, save } = useUpdateDisplayName()

  const [isAboutModalOpened, { open: openAboutModal, close: closeAboutModal }] = useDisclosure(false)

  return (
    <>
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
          <Group align="end">
            <TextInput
              label="Display name"
              value={displayName}
              onChange={event => setDisplayName(event.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Button
              onClick={save}
              loading={isSaving}
              disabled={!isChanged}
            >
              Save
            </Button>
          </Group>

          <Switch
            label="Colour blind mode"
            checked={isColorblindModeOn}
            onChange={event => setIsColorblindModeOn(event.currentTarget.checked)}
          />

          <Group>
            <Text>Change theme</Text>
            <ColorSchemeToggle />
          </Group>

          <Button
            variant="default"
            onClick={() => {
              openAboutModal()
              setIsSettingsOpen(false)
            }}
          >
            About
          </Button>
        </Stack>
      </Modal>

      <AboutModal isOpen={isAboutModalOpened} onClose={closeAboutModal} />
    </>
  )
}
