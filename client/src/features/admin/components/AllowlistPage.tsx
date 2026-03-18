import {
  Alert,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { DateTime } from 'luxon'
import { useState } from 'react'
import { DeleteButton } from '@/components/DeleteButton'
import { notifyError } from '@/utils/utils'
import { useAddToAllowlist, useAllowlist, useRemoveFromAllowlist } from '../queries'
import { AdminBurger } from './AdminBurger'

export function AllowlistPage() {
  const { data, isPending, error } = useAllowlist()
  const addMutation = useAddToAllowlist()
  const removeMutation = useRemoveFromAllowlist()
  const [email, setEmail] = useState('')

  const allowlist = data?.allowlist
  const adminEmails = data?.adminEmails

  async function handleAdd() {
    const trimmed = email.trim()
    if (!trimmed)
      return
    try {
      await addMutation.mutateAsync(trimmed)
      setEmail('')
    }
    catch (err) {
      notifyError('Failed to add email', err)
    }
  }

  if (error) {
    return <Alert color="red">Failed to load allowlist</Alert>
  }

  return (
    <Stack>
      <Group>
        <AdminBurger />
        <Title order={3}>Allowlist</Title>
      </Group>
      <Text c="dimmed" size="sm">Emails allowed to create accounts.</Text>

      <Group>
        <TextInput
          placeholder="user@example.com"
          value={email}
          onChange={e => setEmail(e.currentTarget.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={{ flex: 1 }}
        />
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleAdd}
          loading={addMutation.isPending}
        >
          Add
        </Button>
      </Group>

      {isPending
        ? <Center h="60vh"><Loader type="dots" /></Center>
        : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Added</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {adminEmails?.map(adminEmail => (
                  <Table.Tr key={`admin-${adminEmail}`}>
                    <Table.Td>
                      <Group gap="xs">
                        {adminEmail}
                        <Badge size="xs" color="violet">Admin</Badge>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text c="dimmed" size="sm">N/A</Text>
                    </Table.Td>
                    <Table.Td />
                  </Table.Tr>
                ))}
                {allowlist?.map(entry => (
                  <Table.Tr key={entry.id}>
                    <Table.Td>{entry.email}</Table.Td>
                    <Table.Td>
                      {DateTime.fromJSDate(entry.createdAt).toLocaleString(DateTime.DATE_MED)}
                    </Table.Td>
                    <Table.Td>
                      <DeleteButton
                        loading={removeMutation.isPending}
                        onClick={() => removeMutation.mutate(entry.id)}
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
                {allowlist?.length === 0 && adminEmails?.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={3}>
                      <Text c="dimmed" ta="center">No emails in allowlist</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}
    </Stack>
  )
}
