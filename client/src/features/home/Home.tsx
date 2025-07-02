import { useState } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { IconCalendarPlus, IconSquareRoundedPlusFilled, IconVideoPlus } from '@tabler/icons-react';
import {
  AppShell,
  Button,
  Divider,
  Flex,
  Group,
  Modal,
  Popover,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle';
import { InterviewList } from './InterviewList';
import { ScheduleForm } from './ScheduleForm';

export function Home() {
  const [isNewInterviewPopupOpen, setIsNewInterviewPopupOpen] = useState(false);
  const [isScheduleModalOpened, { open: openScheduleModal, close: closeScheduleModal }] =
    useDisclosure(false);

  return (
    <AppShell
      header={{ height: 100 }}
      styles={{
        header: { border: 'none' },
        main: { height: 'calc(100vh - 100px)' },
      }}
    >
      <AppShell.Header>
        <Group justify="space-between" mr="lg" ml="lg">
          <ColorSchemeToggle />

          <Text
            fz={50}
            fw={900}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          >
            Web-Employ
          </Text>

          <UserButton />
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Modal opened={isScheduleModalOpened} onClose={closeScheduleModal} title="Hi">
          <ScheduleForm />
        </Modal>

        <Flex justify="center" align="center" mt="lg">
          <Flex direction="column" h={400} w={500} gap="md">
            <Flex direction="row" gap="sm" justify="center">
              <Popover opened={isNewInterviewPopupOpen} onChange={setIsNewInterviewPopupOpen}>
                <Popover.Target>
                  <Button
                    onClick={() => setIsNewInterviewPopupOpen((o) => !o)}
                    leftSection={<IconSquareRoundedPlusFilled />}
                  >
                    New interview
                  </Button>
                </Popover.Target>

                <Popover.Dropdown>
                  <Stack>
                    <Button leftSection={<IconVideoPlus />}>Start interview now</Button>
                    <Button
                      leftSection={<IconCalendarPlus />}
                      onClick={() => {
                        setIsNewInterviewPopupOpen(false);
                        openScheduleModal();
                      }}
                    >
                      Schedule interview
                    </Button>
                  </Stack>
                </Popover.Dropdown>
              </Popover>

              <TextInput placeholder="Enter interview code" />
              <Button variant="subtle" disabled>
                Join
              </Button>
            </Flex>

            <Divider size="md" mt="md" mb="md" />

            <InterviewList />
          </Flex>
        </Flex>
      </AppShell.Main>
    </AppShell>
  );
}
