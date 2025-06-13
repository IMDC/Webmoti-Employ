import { Center, Group, Loader, Text, Transition } from '@mantine/core';

interface JoiningScreenProps {
  visible: boolean;
}

export function JoiningScreen({ visible }: JoiningScreenProps) {
  return (
    <Transition
      mounted={visible}
      transition="fade"
      duration={400}
      timingFunction="ease"
      exitDuration={0}
    >
      {(styles) => (
        <Center h="100vh" bg="black" style={styles}>
          <Group>
            <Loader color="white" />
            <Text size="lg">Joining...</Text>
          </Group>
        </Center>
      )}
    </Transition>
  );
}
