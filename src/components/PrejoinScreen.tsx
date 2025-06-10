import { useNavigate } from 'react-router-dom';
import { Button, Center, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { ParticipantTile } from './ParticipantTile';

export function PrejoinScreen() {
  const navigate = useNavigate();

  function join() {
    navigate('/room');
  }

  return (
    <Center mih="100vh">
      <Group>
        <ParticipantTile height={200} width={300} />

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
