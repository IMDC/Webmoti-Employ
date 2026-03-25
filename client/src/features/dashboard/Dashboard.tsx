import {
  ActionIcon,
  Affix,
  AppShell,
  Box,
  Button,
  Card,
  Flex,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Transition,
} from '@mantine/core'
import { useDisclosure, useValidatedState, useWindowScroll } from '@mantine/hooks'
import {
  IconArrowUp,
  IconCalendarPlus,
  IconKeyboard,
  IconVideoPlus,
} from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { DateTime } from 'luxon'
import { RightHeader } from '@/components/RightHeader'
import { HEADER_HEIGHT, HEADER_SIDE_PADDING, OUTER_TOOLBAR_HEIGHT } from '@/utils/constants'
import { getFirstName, isElectron, notifySuccess } from '@/utils/utils'
import { useUser } from '../auth/hooks/useUserStore'
import { InterviewList } from './components/InterviewList'
import { ScheduleForm } from './components/ScheduleForm'
import { JoinCodeInput } from './schema'

declare const __APP_VERSION__: string

function getGreeting(): string {
  const hour = DateTime.local().hour
  if (hour < 12)
    return 'Good morning'
  if (hour < 17)
    return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const [isScheduleModalOpened, { open: openScheduleModal, close: closeScheduleModal }]
    = useDisclosure(false)

  const [scroll, scrollTo] = useWindowScroll()

  const [{ value: joinCode, valid: isJoinCodeValid }, setJoinCode] = useValidatedState(
    '',
    val => JoinCodeInput.safeParse(val).success,
    false,
  )

  const user = useUser()

  return (
    <AppShell
      header={{ height: HEADER_HEIGHT }}
      styles={{
        header: {
          border: 'none',
          marginTop: isElectron() ? OUTER_TOOLBAR_HEIGHT : 0,
          paddingLeft: HEADER_SIDE_PADDING,
          paddingRight: HEADER_SIDE_PADDING,
        },
        main: {
          // shift the content left so the scrollbar doesn't shift the layout
          paddingLeft: 'calc(100vw - 100%)',
        },
      }}
    >
      <AppShell.Header>
        {/* 100vw is needed for the header as well so the scrollbar doesn't shift the layout */}
        <Flex justify="space-between" align="center" w="100vw" h="100%" p="lg">
          <Text ff="monospace" fz="xs">{`v${__APP_VERSION__}`}</Text>
          {/* shift the header left to counteract the above shift */}
          <Box mr="sm">
            <RightHeader />
          </Box>
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
              notifySuccess('Interview scheduled', 'Your interview has been successfully scheduled.')
            }}
          />
        </Modal>

        <Flex justify="center" align="center" direction="column" w="100%">
          <Stack align="center" gap="xs">
            <Title ta="center" mt={50} fz={{ base: 25, sm: 35, md: 45 }} px="lg">
              {`${getGreeting()}, ${getFirstName(user.name)}!`}
            </Title>
            <Text c="dimmed">
              Your interview schedule is below.
            </Text>
          </Stack>

          <Flex
            direction="column"
            gap="md"
            px="md"
            w={{ base: '100%', sm: 500, lg: 700 }}
          >
            <Flex direction="row" gap="md" justify="center" wrap="wrap" align="stretch" mt={{ base: 25, sm: 50 }}>
              <Link to="/interview/prejoin" style={{ textDecoration: 'none', flex: '1 1 0', minWidth: 140, maxWidth: 250, display: 'flex' }}>
                <Card
                  shadow="sm"
                  radius="md"
                  padding="md"
                  withBorder
                  h="100%"
                  w="100%"
                  style={{ cursor: 'pointer', transition: 'box-shadow 150ms ease, transform 150ms ease' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  <Stack align="center" gap="xs">
                    <ThemeIcon size={40} radius="md" variant="light" color="blue">
                      <IconVideoPlus size={22} />
                    </ThemeIcon>
                    <Text fw={600} size="sm">Start now</Text>
                  </Stack>
                </Card>
              </Link>

              <Card
                shadow="sm"
                radius="md"
                padding="md"
                withBorder
                h="100%"
                style={{ cursor: 'pointer', flex: '1 1 0', minWidth: 140, maxWidth: 250, transition: 'box-shadow 150ms ease, transform 150ms ease' }}
                onClick={openScheduleModal}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                <Stack align="center" gap="xs">
                  <ThemeIcon size={40} radius="md" variant="light" color="grape">
                    <IconCalendarPlus size={22} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">Schedule</Text>
                </Stack>
              </Card>
            </Flex>

            <Paper radius="md" p="sm" withBorder>
              <Group wrap="nowrap" gap="xs">
                <ThemeIcon size={28} radius="md" variant="subtle" color="gray">
                  <IconKeyboard size={16} />
                </ThemeIcon>
                <TextInput
                  placeholder="Enter interview code"
                  value={joinCode}
                  onChange={event => setJoinCode(event.currentTarget.value)}
                  error={!isJoinCodeValid && joinCode.length > 0 ? 'Invalid interview code' : false}
                  flex={1}
                  miw={0}
                  variant="unstyled"
                />
                <Link to="/interview/prejoin/$id" params={{ id: joinCode }}>
                  <Button disabled={!isJoinCodeValid} size="sm">
                    Join
                  </Button>
                </Link>
              </Group>
            </Paper>

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
