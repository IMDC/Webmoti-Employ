import { Card, Group, Skeleton } from '@mantine/core';

export function InterviewCardSkeleton() {
  return (
    <Card shadow="sm" padding="sm" withBorder>
      <Group>
        <Skeleton height={24} width={120} radius="sm" />
        <Skeleton height={24} width={80} radius="sm" />
      </Group>

      <Group justify="space-between" mt="sm">
        <Group>
          <Skeleton circle height={36} width={36} />
          <Skeleton height={20} width={160} radius="sm" />
        </Group>
        <Skeleton height={32} width={80} radius="sm" />
      </Group>
    </Card>
  );
}
