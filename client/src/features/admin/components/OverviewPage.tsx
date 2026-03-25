import {
  Alert,
  Anchor,
  Badge,
  Card,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import {
  IconCalendarEvent,
  IconLivePhoto,
  IconShieldCheck,
  IconUsers,
} from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { useDocumentTitle } from '@mantine/hooks'
import { DateTime } from 'luxon'
import { useAdminOverview } from '../queries'
import { AdminBurger } from './AdminBurger'

export function OverviewPage() {
  useDocumentTitle('Overview | Admin | WebMoti-Employ')

  const { data, isPending, error } = useAdminOverview()

  if (error) {
    return (
      <Stack>
        <Group>
          <AdminBurger />
          <Title order={3}>Overview</Title>
        </Group>
        <Alert color="red">Failed to load overview</Alert>
      </Stack>
    )
  }

  return (
    <Stack>
      <Group>
        <AdminBurger />
        <Title order={3}>Overview</Title>
      </Group>

      {isPending || !data
        ? <Center h="60vh"><Loader type="dots" /></Center>
        : <OverviewContent data={data} />}
    </Stack>
  )
}

function OverviewContent({ data }: { data: ReturnType<typeof useAdminOverview>['data'] & {} }) {
  const navigate = useNavigate()
  const { stats, recentInterviews, upcomingInterviews } = data

  return (
    <>
      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={<IconUsers size={20} />}
          color="blue"
          onClick={() => navigate({ to: '/admin/users' })}
        />
        <StatCard
          label="Total Interviews"
          value={stats.totalInterviews}
          icon={<IconCalendarEvent size={20} />}
          color="violet"
          onClick={() => navigate({ to: '/admin/interviews' })}
        />
        <StatCard
          label="Allowlist"
          value={stats.allowlistSize}
          icon={<IconShieldCheck size={20} />}
          color="teal"
          onClick={() => navigate({ to: '/admin/allowlist' })}
        />
        <StatCard
          label="Live Sessions"
          value={stats.liveSessionCount}
          icon={<IconLivePhoto size={20} />}
          color={stats.liveSessionCount > 0 ? 'green' : 'gray'}
          onClick={() => navigate({ to: '/admin/live-sessions' })}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Card withBorder>
          <Group justify="space-between" mb="sm">
            <Title order={5}>Recent Interviews</Title>
            <Anchor size="xs" onClick={() => navigate({ to: '/admin/interviews' })}>
              View all
            </Anchor>
          </Group>
          {recentInterviews.length === 0
            ? <Text c="dimmed" size="sm">No recent interviews</Text>
            : (
                <Table highlightOnHover>
                  <Table.Tbody>
                    {recentInterviews.map(interview => (
                      <Table.Tr
                        key={interview.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate({ to: '/admin/interviews', search: { highlight: interview.id } })}
                      >
                        <Table.Td>
                          <div>
                            <Text size="sm">
                              Interview #
                              {interview.id}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Host:
                              {' '}
                              {interview.hostName ?? 'Unknown'}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={6}>
                            <Badge size="sm" variant="light" color={interview.isInstant ? 'orange' : 'blue'}>
                              {interview.isInstant ? 'Instant' : 'Scheduled'}
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {DateTime.fromJSDate(interview.startTime).toRelative()}
                            </Text>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
        </Card>

        <Card withBorder>
          <Group justify="space-between" mb="sm">
            <Title order={5}>Upcoming Interviews</Title>
            <Anchor size="xs" onClick={() => navigate({ to: '/admin/interviews' })}>
              View all
            </Anchor>
          </Group>
          {upcomingInterviews.length === 0
            ? <Text c="dimmed" size="sm">No upcoming interviews</Text>
            : (
                <Table highlightOnHover>
                  <Table.Tbody>
                    {upcomingInterviews.map(interview => (
                      <Table.Tr
                        key={interview.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate({ to: '/admin/interviews', search: { highlight: interview.id } })}
                      >
                        <Table.Td>
                          <div>
                            <Text size="sm">
                              Interview #
                              {interview.id}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Host:
                              {' '}
                              {interview.hostName ?? 'Unknown'}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Badge size="sm" variant="light">
                            {DateTime.fromJSDate(interview.startTime).toRelative()}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
        </Card>
      </SimpleGrid>
    </>
  )
}

function StatCard({ label, value, icon, color, onClick }: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  onClick: () => void
}) {
  return (
    <Card
      withBorder
      style={{ cursor: 'pointer' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'none'
      }}
    >
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
          <Text size="xl" fw={700}>{value}</Text>
        </div>
        <Badge size="lg" variant="light" color={color} p={8}>
          {icon}
        </Badge>
      </Group>
    </Card>
  )
}
