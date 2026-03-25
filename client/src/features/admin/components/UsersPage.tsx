import {
  Alert,
  Avatar,
  Center,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { useDocumentTitle } from '@mantine/hooks'
import { useSearch } from '@tanstack/react-router'
import { DateTime } from 'luxon'
import { useEffect, useRef, useState } from 'react'
import { DeleteButton } from '@/components/DeleteButton'
import { notifyError, notifyWarning } from '@/utils/utils'
import adminClasses from '../admin.module.css'
import { useAdminDeleteUser, useAdminEmails, useAdminUsers } from '../queries'
import { AdminBadge } from './AdminBadge'
import { AdminBurger } from './AdminBurger'

export function UsersPage() {
  useDocumentTitle('Admin | WebMoti')

  const { data: users, isPending, error } = useAdminUsers()
  const { data: adminEmails } = useAdminEmails()
  const deleteMutation = useAdminDeleteUser()
  const { highlight } = useSearch({ strict: false }) as { highlight?: string }
  const highlightRef = useRef<HTMLTableRowElement>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (highlight && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlight, users])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteMutation.mutateAsync(id)
    }
    catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 400) {
        notifyWarning('Cannot delete your own account')
      }
      else {
        notifyError('Failed to delete user', err)
      }
    }
    finally {
      setDeletingId(null)
    }
  }

  if (error) {
    return <Alert color="red">Failed to load users</Alert>
  }

  return (
    <Stack>
      <Group>
        <AdminBurger />
        <Title order={3}>Users</Title>
      </Group>
      <Text c="dimmed" size="sm">All registered accounts.</Text>

      {isPending
        ? <Center h="60vh"><Loader type="dots" /></Center>
        : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Joined</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users?.map(user => (
                  <Table.Tr
                    key={user.id}
                    ref={highlight === user.id ? highlightRef : undefined}
                    className={highlight === user.id ? adminClasses.highlightRow : undefined}
                  >
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
                    <Table.Td>
                      {adminEmails?.includes(user.email.toLowerCase()) && <AdminBadge />}
                    </Table.Td>
                    <Table.Td>
                      {!adminEmails?.includes(user.email.toLowerCase()) && (
                        <DeleteButton
                          label="Delete user"
                          loading={deletingId === user.id}
                          onClick={() => handleDelete(user.id)}
                        />
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
                {users?.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
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
