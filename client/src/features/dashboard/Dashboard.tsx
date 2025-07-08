import { useState } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { IconCalendarPlus, IconSquareRoundedPlusFilled, IconVideoPlus } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import {
  AppShell,
  Button,
  Center,
  Divider,
  Flex,
  Modal,
  Popover,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure, useValidatedState } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle';
import { Corner } from '@/components/Corner';
import { InterviewList } from './components/InterviewList';
import { ScheduleForm } from './components/ScheduleForm';
import { JoinCodeInput } from './schema';

export function Dashboard() {
  const [isNewInterviewPopupOpen, setIsNewInterviewPopupOpen] = useState(false);
  const [isScheduleModalOpened, { open: openScheduleModal, close: closeScheduleModal }] =
    useDisclosure(false);

  const [{ value: joinCode, valid: isJoinCodeValid }, setJoinCode] = useValidatedState(
    '',
    (val) => JoinCodeInput.safeParse(val).success,
    false
  );

  const navigate = useNavigate();

  return (
    <AppShell
      header={{ height: 100 }}
      styles={{
        header: { border: 'none' },
        main: { height: 'calc(100vh - 100px)' },
      }}
    >
      <AppShell.Header>
        <Corner>
          <ColorSchemeToggle />
        </Corner>

        <Center>
          <Text
            fz={50}
            fw={900}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          >
            WebMoti-Employ
          </Text>
        </Center>

        <Corner position="top-right">
          <UserButton />
        </Corner>
      </AppShell.Header>

      <AppShell.Main>
        <Modal
          opened={isScheduleModalOpened}
          onClose={closeScheduleModal}
          title={<Text fw="bolder">New Interview</Text>}
          overlayProps={{
            backgroundOpacity: 0.55,
            blur: 3,
          }}
        >
          <ScheduleForm
            onSuccess={() => {
              closeScheduleModal();
              notifications.show({
                title: 'Interview scheduled',
                message: 'Your interview has been successfully scheduled.',
              });
            }}
          />
        </Modal>

        <Flex justify="center" align="center" mt="lg">
          <Flex direction="column" h={500} w={500} gap="md">
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
                    <Button
                      leftSection={<IconVideoPlus />}
                      onClick={() => navigate({ to: '/interview/prejoin' })}
                    >
                      Start interview now
                    </Button>
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

              <TextInput
                placeholder="Enter interview code"
                value={joinCode}
                onChange={(event) => setJoinCode(event.currentTarget.value)}
                error={!isJoinCodeValid && joinCode.length > 0 ? 'Invalid interview code' : false}
              />
              <Button
                disabled={!isJoinCodeValid}
                onClick={() => navigate({ to: '/interview/prejoin/$id', params: { id: joinCode } })}
              >
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
