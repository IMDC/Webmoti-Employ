import { UserButton, useUser } from '@clerk/clerk-react'
import {
  ActionIcon,
  Affix,
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
  Title,
  Transition,
} from '@mantine/core'
import { useDisclosure, useValidatedState, useWindowScroll } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconArrowUp,
  IconCalendarPlus,
  IconSquareRoundedPlusFilled,
  IconVideoPlus,
} from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { SettingsButton } from '@/components/SettingsButton'
import { InterviewList } from './components/InterviewList'
import { ScheduleForm } from './components/ScheduleForm'
import { JoinCodeInput } from './schema'

export function Dashboard() {
  const [isNewInterviewPopupOpen, setIsNewInterviewPopupOpen] = useState(false)
  const [isScheduleModalOpened, { open: openScheduleModal, close: closeScheduleModal }]
    = useDisclosure(false)

  const { user } = useUser()

  const [scroll, scrollTo] = useWindowScroll()

  const [{ value: joinCode, valid: isJoinCodeValid }, setJoinCode] = useValidatedState(
    '',
    val => JoinCodeInput.safeParse(val).success,
    false,
  )

  const navigate = useNavigate()

  return (
    <AppShell
      header={{ height: 60 }}
      styles={{
        header: { border: 'none' },
        // hide horizontal scrollbar
        main: { overflowX: 'hidden' },
      }}
    >
      <AppShell.Header>
        {/* 100vw makes it so the scrollbar doesn't shift the layout */}
        <Flex justify="space-between" align="center" w="100vw" h="100%" p="lg">

          <Text
            fz={{ base: 15, sm: 25 }}
            fw={900}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          >
            WebMoti-Employ
          </Text>

          <Group>
            <SettingsButton />
            <UserButton />
          </Group>
        </Flex>
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
              closeScheduleModal()
              notifications.show({
                title: 'Interview scheduled',
                message: 'Your interview has been successfully scheduled.',
              })
            }}
          />
        </Modal>

        <Flex justify="center" align="center"direction="column" w="100vw">
          <Stack align="center" gap="xs">
            <Title ta="center" mt={{ base: 25, sm: 50 }} fz={{ base: 25, sm: 35, md: 45 }} px="lg">
              {`Welcome ${user!.firstName}!`}
            </Title>
            <Text c="dimmed">
              Your interview schedule is below.
            </Text>
          </Stack>

          <Flex
            direction="column"
            gap="md"
            px="md"
            w={{ base: 300, sm: 500, lg: 700 }}
          >
            <Flex direction="row" gap="lg" justify="center" wrap="wrap" mt={{ base: 25, sm: 50 }}>
              <Popover opened={isNewInterviewPopupOpen} onChange={setIsNewInterviewPopupOpen}>
                <Popover.Target>
                  <Button
                    onClick={() => setIsNewInterviewPopupOpen(o => !o)}
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
                        setIsNewInterviewPopupOpen(false)
                        openScheduleModal()
                      }}
                    >
                      Schedule interview
                    </Button>
                  </Stack>
                </Popover.Dropdown>
              </Popover>

              <Group>
                <TextInput
                  placeholder="Enter interview code"
                  value={joinCode}
                  onChange={event => setJoinCode(event.currentTarget.value)}
                  error={!isJoinCodeValid && joinCode.length > 0 ? 'Invalid interview code' : false}
                />
                <Button
                  disabled={!isJoinCodeValid}
                  onClick={() => navigate({ to: '/interview/prejoin/$id', params: { id: joinCode } })}
                >
                  Join
                </Button>
              </Group>
            </Flex>

            <Divider size="md" />

            <InterviewList />
          </Flex>
        </Flex>

        <Affix position={{ bottom: 20, right: 20 }}>
          <Transition transition="slide-up" mounted={scroll.y > 0}>
            {transitionStyles => (
              <ActionIcon style={transitionStyles} onClick={() => scrollTo({ y: 0 })}>
                <IconArrowUp size={16} />
              </ActionIcon>
            )}
          </Transition>
        </Affix>
      </AppShell.Main>
    </AppShell>
  )
}
