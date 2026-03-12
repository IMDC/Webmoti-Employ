import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core'
import { useUpdateDisplayName } from '../hooks/useUpdateDisplayName'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { displayName, setDisplayName, isSaving, isChanged, save } = useUpdateDisplayName()

  async function handleSave() {
    await save()
    onClose()
  }

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={<Text fw="bolder">Edit Profile</Text>}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack>
        <Group align="end">
          <TextInput
            label="Name"
            value={displayName}
            onChange={event => setDisplayName(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button
            onClick={handleSave}
            loading={isSaving}
            disabled={!isChanged}
          >
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
