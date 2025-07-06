import { useNavigate } from '@tanstack/react-router';
import { Button, Center, Group, Stack, Title } from '@mantine/core';

export function EndScreen() {
  const navigate = useNavigate();

  return (
    <Center h="100vh">
      <Stack align="center" gap="xl">
        <Title>Thanks for attending the interview</Title>
        <Group>
          <Button>Rejoin</Button>
          <Button onClick={() => navigate({ to: '/' })}>Go to Dashboard</Button>
        </Group>
      </Stack>
    </Center>
  );
}
