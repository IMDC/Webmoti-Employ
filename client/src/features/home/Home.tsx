import { IconVideoFilled } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { AppShell, Button, Center, Divider, Flex, Text, TextInput } from '@mantine/core';
import { InterviewList } from './InterviewList';

async function getInterviews() {
  const response = await fetch('/api/interviews');
  return await response.json();
}

export function Home() {
  const { data } = useQuery({ queryKey: ['interviews'], queryFn: getInterviews });

  return (
    <AppShell
      header={{ height: 100 }}
      styles={{
        header: { border: 'none' },
        main: { height: 'calc(100vh - 100px)' },
      }}
    >
      <AppShell.Header>
        <Center h="100%">
          <Text
            fz={50}
            fw={900}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          >
            Web-Employ
          </Text>
        </Center>
      </AppShell.Header>

      <AppShell.Main>
        <Flex justify="center" align="center" mt="lg">
          <Flex direction="column" h={400} w={500} gap="md">
            <Flex direction="row" gap="sm" justify="center">
              <Button leftSection={<IconVideoFilled />}>New interview</Button>
              <TextInput placeholder="Enter interview code" />
              <Button variant="subtle" disabled>
                Join
              </Button>
            </Flex>

            <Divider size="md" mt="md" mb="md" />

            <InterviewList interviews={data}/>
          </Flex>
        </Flex>
      </AppShell.Main>
    </AppShell>
  );
}
