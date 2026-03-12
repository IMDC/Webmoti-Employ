import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core'
import { GoogleAvatar } from '@/components/GoogleAvatar'
import { useEditProfile } from '../hooks/useUpdateDisplayName'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { name, setName, image, setImage, isSaving, isChanged, save } = useEditProfile()

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
        <Group justify="center">
          <GoogleAvatar src={image || undefined} size="xl" />
        </Group>

        <TextInput
          label="Profile picture URL"
          placeholder="https://example.com/photo.jpg"
          value={image}
          onChange={event => setImage(event.currentTarget.value)}
        />

        <TextInput
          label="Name"
          value={name}
          onChange={event => setName(event.currentTarget.value)}
        />

        <Button
          onClick={handleSave}
          loading={isSaving}
          disabled={!isChanged}
          fullWidth
        >
          Save
        </Button>
      </Stack>
    </Modal>
  )
}
