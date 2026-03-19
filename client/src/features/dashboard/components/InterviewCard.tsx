import type { InterviewResponse } from '@webmoti-employ/shared'
import { ActionIcon, Avatar, Badge, Button, Card, Divider, Flex, Group, Stack, Text, Tooltip } from '@mantine/core'
import { IconReport, IconTie, IconTrash, IconVideoFilled } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { DateTime } from 'luxon'
import { GoogleAvatar } from '@/components/GoogleAvatar'
import { MyCopyButton } from '@/components/MyCopyButton'
import { UserList } from '@/components/UserList'
import { useUser } from '@/features/auth/hooks/useUserStore'
import { useInviteProfiles } from '@/features/interview/profiles/useInviteProfiles'
import { getInterviewLink } from '@/utils/utils'
import { useDeleteInterview } from '../queries'

function counterpartInfo(
  interview: InterviewResponse,
  profiles: Record<string, { displayName: string, profilePic: string } | null> | undefined,
  userEmail: string,
) {
  const youAreInterviewer = interview.invites.find(i => i.email === userEmail)?.isInterviewer
  const others = interview.invites.filter(i => i.isInterviewer !== youAreInterviewer)

  const names: string[] = []
  const pics: string[] = []

  for (const { email } of others) {
    const profile = profiles?.[email] ?? null
    const name = profile?.displayName ?? email.split('@')[0]
    const pic = profile?.profilePic ?? ''

    names.push(name)
    pics.push(pic)
  }

  return {
    displayLine: names.length ? `Interview with ${names.join(', ')}` : 'Interview',
    pics,
    youAreInterviewer,
  }
}

interface InterviewCardProps {
  interview: InterviewResponse
}

export function InterviewCard({ interview }: InterviewCardProps) {
  const emailArray = [...new Set((interview.invites ?? []).map(user => user.email))]
  const { profiles, isLoadingProfiles } = useInviteProfiles(emailArray)

  const user = useUser()
  const { displayLine, pics, youAreInterviewer } = counterpartInfo(interview, profiles, user.email)
  const isHost = interview.hostId === user.id
  const { deleteInterviewMutation, isDeleteInterviewPending } = useDeleteInterview()

  const now = DateTime.local()
  const startDt = DateTime.fromJSDate(interview.startTime).setZone('local')
  const startedToday = startDt.hasSame(now, 'day')
  // Today's meetings stay joinable all day
  const isEnded = !startedToday && interview.endTime ? interview.endTime < now.toJSDate() : false

  const formattedInterviewTime = startDt.toLocaleString(DateTime.DATETIME_MED)
  const relativeTime = startedToday ? startDt.toRelative() : null

  return (
    <Card key={interview.id} shadow="sm" padding="sm" withBorder>
      <Group justify="space-between">
        <Group>
          <Badge
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
            leftSection={youAreInterviewer ? <IconReport size={12} /> : <IconTie size={12} />}
          >
            { youAreInterviewer ? 'Interviewer' : 'Interviewee' }
          </Badge>
          {relativeTime && (
            <Badge variant="light" color="gray">
              {relativeTime}
            </Badge>
          )}
        </Group>
        <Group gap="xs">
          <UserList
            users={interview.invites ?? []}
            profiles={profiles}
            isLoadingProfiles={isLoadingProfiles}
          />
          {isHost && (
            <Tooltip label="Delete interview">
              <ActionIcon
                variant="subtle"
                color="red"
                aria-label="Delete interview"
                loading={isDeleteInterviewPending}
                onClick={() => deleteInterviewMutation(interview.id)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      <Stack justify="center" align="center" flex="grow" mt="sm">
        <Text fw="bolder"ff="monospace">
          {formattedInterviewTime}
        </Text>

        <Flex
          direction={{ base: 'column', sm: 'row' }}
          align="center"
          gap="xs"
        >
          {interview.invites.length > 1
            && (
              <Avatar.Group spacing="sm">
                {pics.slice(0, 3).map((src, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <GoogleAvatar key={i} src={src} radius="xl" />
                ))}
                {pics.length > 3 && (
                  <Avatar radius="xl">
                    +
                    {pics.length - 3}
                  </Avatar>
                )}
              </Avatar.Group>
            )}

          {interview.invites.length < 2
            ? <Text fw="bold">No participants invited</Text>
            : <Text fw="bold">{displayLine}</Text>}
        </Flex>

        <Link to="/interview/prejoin/$id" params={{ id: interview.sessionId }}>
          <Button
            w="100%"
            maw={250}
            disabled={isEnded}
            leftSection={<IconVideoFilled />}
          >
            Join
          </Button>
        </Link>
      </Stack>

      <Divider my="sm" />
      <Group justify="center" align="center" gap={5}>
        <Text fz={{ base: 10, sm: 'sm' }} ff="monospace" c="dimmed">
          {interview.sessionId}
        </Text>
        <MyCopyButton
          copyText={getInterviewLink(interview.sessionId)}
          copyTooltip="Copy interview link"
        />
      </Group>
    </Card>
  )
}
