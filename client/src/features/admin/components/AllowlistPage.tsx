import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { DateTime } from 'luxon'
import { useState } from 'react'
import { notifyError } from '@/utils/utils'
import { useAddToAllowlist, useAllowlist, useRemoveFromAllowlist } from '../queries'

export function AllowlistPage() {
  const { data: allowlist, isPending, error } = useAllowlist()
  const addMutation = useAddToAllowlist()
  const removeMutation = useRemoveFromAllowlist()
  const [email, setEmail] = useState('')

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
      <Title order={3}>Allowlist</Title>
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
        ? <Loader />
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
                {allowlist?.map(entry => (
                  <Table.Tr key={entry.id}>
                    <Table.Td>{entry.email}</Table.Td>
                    <Table.Td>
                      {DateTime.fromJSDate(entry.createdAt).toLocaleString(DateTime.DATE_MED)}
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label="Remove">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          loading={removeMutation.isPending}
                          onClick={() => removeMutation.mutate(entry.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {allowlist?.length === 0 && (
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
