import { Center, Group, Loader, Text, Transition } from '@mantine/core'

interface JoiningScreenProps {
  visible: boolean
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
      {styles => (
        <Center
          style={{
            ...styles,
            position: 'fixed',
            inset: 0,
            backgroundColor: 'black',
            zIndex: 1000,
          }}
        >
          <Group>
            <Loader color="white" />
            <Text size="lg">Joining...</Text>
          </Group>
        </Center>
      )}
    </Transition>
  )
}
