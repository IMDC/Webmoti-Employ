import { useNavigate } from 'react-router-dom';
import { Button, Card, Center, Group, Stack, Text, TextInput, Title } from '@mantine/core';

export function PrejoinScreen() {
  const navigate = useNavigate();

  function join() {
    navigate('/room');
  }

  return (
    <Center mih="100vh">
      <Group>
        <Card h={200} w={300} />

        <Stack>
          <Title>Interview with Joe</Title>
          <Text>2 PM</Text>

          <TextInput placeholder="Your name" />

          <Button onClick={join}>Join now</Button>
        </Stack>
      </Group>
    </Center>
  );
}
