import {
  Avatar,
  Box,
  Divider,
  Group,
  Loader,
  Menu,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { IconLogout } from '@tabler/icons-react'
import { useState } from 'react'
import { signOut } from '@/lib/auth-client'
import { useUser } from '../hooks/useUserStore'

export function UserButton() {
  const [loading, setLoading] = useState(false)
  const user = useUser()

  return (
    <Menu
      closeOnItemClick={false}
      shadow="md"
      width={250}
      position="bottom-end"
      offset={8}
    >
      <Menu.Target>
        <UnstyledButton>
          <Avatar src={user.image} size="md" />
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Group px="md" py="sm">
          <Avatar src={user.image} size="md" />
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
  )
}
