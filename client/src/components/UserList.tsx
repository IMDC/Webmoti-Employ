import type { DbInterviewInvite } from '@web-employ/shared'
import { useUser } from '@clerk/clerk-react'
import { ActionIcon, Avatar, Group, Popover, Skeleton, Stack, Text } from '@mantine/core'
import { IconUser } from '@tabler/icons-react'
import { useState } from 'react'
import { useInviteProfiles } from '@/features/interview/profiles/useInviteProfiles'
import { getUserIdentity } from '@/utils/utils'

interface DisplayUserProps {
  name: string
  avatarUrl?: string
  isLoading: boolean
}

function DisplayUser({ name, avatarUrl, isLoading }: DisplayUserProps) {
  return (
    <Skeleton visible={isLoading}>
      <Group>
        <Avatar src={avatarUrl} size={16} />

        <Text size="sm" fw={500}>
          {name}
        </Text>
      </Group>
    </Skeleton>
  )
}

interface UserListProps {
  users: DbInterviewInvite[]
}

export function UserList({ users }: UserListProps) {
  const { user } = useUser()
  const userIdentity = getUserIdentity(user!)

  const emailArray = [...new Set(users.map(user => user.email))]

  const [isPopoverOpened, setIsPopoverOpened] = useState(false)

  const { profiles, isLoadingProfiles } = useInviteProfiles(emailArray, isPopoverOpened)

  return (
    <Popover
      opened={isPopoverOpened}
      onChange={setIsPopoverOpened}
      width={200}
      position="bottom"
      withArrow
      shadow="md"
    >
      <Popover.Target>
        <ActionIcon variant="default" onClick={() => setIsPopoverOpened(o => !o)}>
          <IconUser size={16} />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap="sm">
          <DisplayUser name={userIdentity} avatarUrl={user?.imageUrl} isLoading={false} />

          {users.length > 0
            ? (
                <>
                  {users.map((invite) => {
                    const profile = profiles?.[invite.email]
                    const name = profile?.displayName || invite.email.split('@')[0]
                    const avatarUrl = profile?.profilePic

                    return (
                      <DisplayUser
                        key={invite.id}
                        name={name}
                        avatarUrl={avatarUrl}
                        isLoading={isLoadingProfiles}
                      />
                    )
                  })}
                </>
              )
            : (
                <Text>No users invited</Text>
              )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}
