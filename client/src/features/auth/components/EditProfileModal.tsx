import { Button, Divider, Group, Modal, Stack, Text, TextInput } from '@mantine/core'
import { useState } from 'react'
import { GoogleAvatar } from '@/components/GoogleAvatar'
import { authClient } from '@/lib/auth-client'
import { notifyError, removeLocalBearerToken } from '@/utils/utils'
import { useEditProfile } from '../hooks/useUpdateDisplayName'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { name, setName, image, setImage, isSaving, isChanged, save } = useEditProfile()
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleSave() {
    await save()
    onClose()
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await authClient.deleteUser({})
      removeLocalBearerToken()
      window.location.reload()
    }
    catch (error) {
      notifyError('Failed to delete account', error)
      setIsDeleting(false)
      setIsConfirmingDelete(false)
    }
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

        <Divider />

        {isConfirmingDelete
          ? (
              <Stack gap="xs">
                <Text size="sm" c="red">Are you sure? This action cannot be undone.</Text>
                <Group grow>
                  <Button
                    variant="default"
                    onClick={() => setIsConfirmingDelete(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="red"
                    onClick={handleDelete}
                    loading={isDeleting}
                  >
                    Delete Account
                  </Button>
                </Group>
              </Stack>
            )
          : (
              <Button
                variant="subtle"
                color="red"
                fullWidth
                onClick={() => setIsConfirmingDelete(true)}
              >
                Delete Account
              </Button>
            )}
      </Stack>
    </Modal>
  )
}
