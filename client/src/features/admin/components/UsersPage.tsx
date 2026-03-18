import { Alert, Avatar, Group, Loader, Stack, Table, Text, Title } from '@mantine/core'
import { DateTime } from 'luxon'
import { useAdminUsers } from '../queries'

export function UsersPage() {
  const { data: users, isPending, error } = useAdminUsers()

  if (error) {
    return <Alert color="red">Failed to load users</Alert>
  }

  return (
    <Stack>
      <Title order={3}>Users</Title>
      <Text c="dimmed" size="sm">All registered accounts.</Text>

      {isPending
        ? <Loader />
        : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Joined</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users?.map(user => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar src={user.image} size="sm" radius="xl" />
                        <Text size="sm">{user.name}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{user.email}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {DateTime.fromJSDate(user.createdAt).toLocaleString(DateTime.DATE_MED)}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {users?.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={3}>
                      <Text c="dimmed" ta="center">No users found</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}
    </Stack>
  )
}
