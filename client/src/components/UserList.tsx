import { useUser } from '@clerk/clerk-react';
import { IconUser } from '@tabler/icons-react';
import { ActionIcon, Avatar, Group, Popover, Stack, Text } from '@mantine/core';
import { InterviewInvite } from '@web-employ/shared';
import { getUserIdentity } from '@/utils/utils';

interface DisplayUserProps {
  name: string;
  avatarUrl?: string;
}

function DisplayUser({ name, avatarUrl }: DisplayUserProps) {
  return (
    <Group>
      <Avatar src={avatarUrl} size={16} />

      <Text size="sm" fw={500}>
        {name}
      </Text>
    </Group>
  );
}

interface UserListProps {
  users: InterviewInvite[];
}

export function UserList({ users }: UserListProps) {
  const { user } = useUser();
  const userIdentity = getUserIdentity(user!);

  return (
    <Popover width={200} position="bottom" withArrow shadow="md">
      <Popover.Target>
        <ActionIcon variant="default">
          <IconUser size={16} />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap="sm">
          <DisplayUser name={userIdentity} avatarUrl={user?.imageUrl} />

          {users.length > 0 ? (
            <>
              <Text size="xs" c="gray">
                Invited
              </Text>
              {users.map((invite) => (
                <DisplayUser key={invite.id} name={invite.email.split('@')[0]} />
              ))}
            </>
          ) : (
            <Text>No users invited</Text>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
