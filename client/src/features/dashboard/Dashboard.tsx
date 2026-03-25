import {
  ActionIcon,
  Affix,
  AppShell,
  Box,
  Button,
  Divider,
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
import { useDisclosure, useDocumentTitle, useValidatedState, useWindowScroll } from '@mantine/hooks'
import {
  IconArrowUp,
  IconCalendarPlus,
  IconKeyboard,
  IconMoon,
  IconSun,
  IconSunset2,
  IconVideoPlus,
} from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { DateTime } from 'luxon'
import { RightHeader } from '@/components/RightHeader'
import {
  HEADER_HEIGHT,
  HEADER_SIDE_PADDING,
  OUTER_TOOLBAR_HEIGHT,
} from '@/utils/constants'
import { getFirstName, isElectron, notifySuccess } from '@/utils/utils'
import { useUser } from '../auth/hooks/useUserStore'
import { InterviewList } from './components/InterviewList'
import { ScheduleForm } from './components/ScheduleForm'
import classes from './Dashboard.module.css'
import { JoinCodeInput } from './schema'

declare const __APP_VERSION__: string

function getGreeting(): { text: string, icon: React.ReactNode, color: string } {
  const hour = DateTime.local().hour
  if (hour < 12)
    return { text: 'Good morning', icon: <IconSun size={28} />, color: 'yellow' }
  if (hour < 17)
    return { text: 'Good afternoon', icon: <IconSunset2 size={28} />, color: 'orange' }
  return { text: 'Good evening', icon: <IconMoon size={28} />, color: 'indigo' }
}

export function Dashboard() {
  useDocumentTitle('Dashboard | WebMoti')

  const [isScheduleModalOpened, { open: openScheduleModal, close: closeScheduleModal }]
    = useDisclosure(false)

  const [scroll, scrollTo] = useWindowScroll()

  const [{ value: joinCode, valid: isJoinCodeValid }, setJoinCode] = useValidatedState(
    '',
    val => JoinCodeInput.safeParse(val).success,
    false,
  )

  const user = useUser()
  const greeting = getGreeting()

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

        <Flex justify="center" w="100%">
          <Stack
            gap="lg"
            px="md"
            w={{ base: '100%', sm: 550, lg: 750 }}
            mt={{ base: 30, sm: 50 }}
          >
            {/* Hero: time-of-day icon + greeting */}
            <Flex gap="md" align="center" direction={{ base: 'column', sm: 'row' }}>
              <ThemeIcon className={classes.greetingIcon} size={48} radius="xl" variant="light" color={greeting.color} aria-hidden="true">
                {greeting.icon}
              </ThemeIcon>
              <div style={{ textAlign: 'inherit' }}>
                <Title fz={{ base: 22, sm: 30 }} ta={{ base: 'center', sm: 'left' }}>
                  {`${greeting.text}, ${getFirstName(user.name)}!`}
                </Title>
                <Text c="dimmed" fz="sm" ta={{ base: 'center', sm: 'left' }}>Your interview schedule is below.</Text>
              </div>
            </Flex>

            {/* Action bar: buttons + join code */}
            <Group gap="sm" wrap="wrap" justify="center">
              <Link to="/interview/prejoin" style={{ textDecoration: 'none' }}>
                <Button leftSection={<IconVideoPlus size={18} />}>
                  Start now
                </Button>
              </Link>
              <Button
                variant="light"
                leftSection={<IconCalendarPlus size={18} />}
                onClick={openScheduleModal}
              >
                Schedule
              </Button>
              <Paper radius="md" p={4} pl="sm" withBorder flex={1} miw={200}>
                <Group wrap="nowrap" gap="xs">
                  <ThemeIcon size={24} radius="md" variant="subtle" color="gray">
                    <IconKeyboard size={14} />
                  </ThemeIcon>
                  <TextInput
                    placeholder="Enter interview code"
                    value={joinCode}
                    onChange={event => setJoinCode(event.currentTarget.value)}
                    error={!isJoinCodeValid && joinCode.length > 0 ? 'Invalid interview code' : false}
                    flex={1}
                    miw={0}
                    variant="unstyled"
                    size="sm"
                  />
                  <Link to="/interview/prejoin/$id" params={{ id: joinCode }}>
                    <Button disabled={!isJoinCodeValid} size="xs">
                      Join
                    </Button>
                  </Link>
                </Group>
              </Paper>
            </Group>

            <Divider />

            {/* Interview list */}
            <InterviewList />
          </Stack>
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
