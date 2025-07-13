import type { InterviewInviteResponse, ProfilesResponse } from '@web-employ/shared'
import { ActionIcon, Avatar, Group, Popover, Skeleton, Stack, Text } from '@mantine/core'
import { IconUserFilled } from '@tabler/icons-react'

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
  users: InterviewInviteResponse[]
  profiles: ProfilesResponse | undefined
  isLoadingProfiles: boolean
}

export function UserList({ users, profiles, isLoadingProfiles }: UserListProps) {
  return (
    <Popover
      width={200}
      position="bottom"
      withArrow
      shadow="md"
    >
      <Popover.Target>
        <ActionIcon variant="default">
          <IconUserFilled size={16} />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap="sm">
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
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}
