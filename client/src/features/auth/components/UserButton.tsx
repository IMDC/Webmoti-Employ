import {
  Box,
  Divider,
  Group,
  Loader,
  Menu,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconLogout, IconPencil } from '@tabler/icons-react'
import { useState } from 'react'
import { GoogleAvatar } from '@/components/GoogleAvatar'
import { signOut } from '@/lib/auth-client'
import { useUser } from '../hooks/useUserStore'
import { EditProfileModal } from './EditProfileModal'

export function UserButton() {
  const [loading, setLoading] = useState(false)
  const user = useUser()
  const [isEditProfileOpen, { open: openEditProfile, close: closeEditProfile }] = useDisclosure(false)

  return (
    <>
      <Menu
        shadow="md"
        width={250}
        position="bottom-end"
        offset={8}
      >
        <Menu.Target>
          <UnstyledButton>
            <GoogleAvatar src={user.image} size="md" />
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Group px="md" py="sm">
            <GoogleAvatar src={user.image} size="md" />
            <Box>
              <Text size="sm" fw={500}>
                {user.name}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {user.email}
              </Text>
            </Box>
          </Group>

          <Divider />

          <Menu.Item
            leftSection={<IconPencil size={16} />}
            onClick={openEditProfile}
          >
            Edit Profile
          </Menu.Item>

          <Menu.Item
            leftSection={loading
              ? <Loader size={16} />
              : <IconLogout size={16} />}
            color="red"
            onClick={async () => {
              setLoading(true)
              await signOut()
            }}
          >
            Sign Out
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <EditProfileModal isOpen={isEditProfileOpen} onClose={closeEditProfile} />
    </>
  )
}
