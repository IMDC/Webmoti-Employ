import { UserButton } from '@clerk/clerk-react'
import {
  ActionIcon,
  Affix,
  AppShell,
  Button,
  Divider,
  Flex,
  Modal,
  Popover,
  Stack,
  Text,
  TextInput,
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
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle'
import { InterviewList } from './components/InterviewList'
import { ScheduleForm } from './components/ScheduleForm'
import { JoinCodeInput } from './schema'

export function Dashboard() {
  const [isNewInterviewPopupOpen, setIsNewInterviewPopupOpen] = useState(false)
  const [isScheduleModalOpened, { open: openScheduleModal, close: closeScheduleModal }]
    = useDisclosure(false)

  const [scroll, scrollTo] = useWindowScroll()

  const [{ value: joinCode, valid: isJoinCodeValid }, setJoinCode] = useValidatedState(
    '',
    val => JoinCodeInput.safeParse(val).success,
    false,
  )

  const navigate = useNavigate()

  return (
    <AppShell
      header={{ height: 80 }}
      styles={{
        header: { border: 'none' },
        main: { height: 'calc(100vh - 100px)' },
      }}
    >
      <AppShell.Header>
        <Flex justify="space-between" align="center" w="100%" h="100%" p="lg">
          <ColorSchemeToggle />

          <Text
            fz={{ base: 30, sm: 40, lg: 50 }}
            fw={900}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          >
            WebMoti-Employ
          </Text>

          <UserButton />
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

        <Flex justify="center" align="center" mt="lg">
          <Flex direction="column" gap="md">
            <Flex direction="row" gap="sm" justify="center">
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
            </Flex>

            <Divider size="md" mt="md" mb="md" />

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
