import type { InterviewResponse } from '@web-employ/shared'
import { ActionIcon, Avatar, Badge, Button, Card, Divider, Flex, Group, Stack, Text } from '@mantine/core'
import { IconPlus, IconReport, IconTie, IconVideoFilled } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { MyCopyButton } from '@/components/MyCopyButton'
import { UserList } from '@/components/UserList'
import { useInviteProfiles } from '@/features/interview/profiles/useInviteProfiles'
import { getInterviewLink } from '@/utils/utils'

function counterpartInfo(
  interview: InterviewResponse,
  profiles: Record<string, { displayName: string, profilePic: string } | null> | undefined,
) {
  const youAreInterviewer
    = interview.yourRole === 'creator' || interview.yourRole === 'interviewer'

  const others = interview.invites.filter(i =>
    youAreInterviewer
      ? !i.isInterviewer && !i.isInterviewCreator
      : i.isInterviewer || i.isInterviewCreator,
  )

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
  const navigate = useNavigate()

  const emailArray = [...new Set((interview.invites ?? []).map(user => user.email))]
  const { profiles, isLoadingProfiles } = useInviteProfiles(emailArray)

  const { displayLine, pics, youAreInterviewer } = counterpartInfo(interview, profiles)

  const isEnded = interview.endTime < new Date()

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
        </Group>
        <UserList
          users={interview.invites ?? []}
          profiles={profiles}
          isLoadingProfiles={isLoadingProfiles}
        />
      </Group>

      <Stack justify="center" align="center" flex="grow" mt="sm">
        <Text fw="bolder"ff="monospace">
          {formatInterviewTime(interview.startTime)}
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
                  <Avatar key={i} src={src} radius="xl" />
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
            ? (
                <Group gap="xs">
                  <ActionIcon variant="default">
                    <IconPlus size={16} />
                  </ActionIcon>
                  <Text fw="bold">Invite a guest</Text>
                </Group>
              )
            : <Text fw="bold">{displayLine}</Text>}
        </Flex>

        <Button
          w="100%"
          maw={250}
          onClick={() =>
            navigate({ to: '/interview/prejoin/$id', params: { id: interview.sessionId } })}
          disabled={isEnded}
          leftSection={<IconVideoFilled />}
        >
          Join
        </Button>
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

function formatInterviewTime(startTime: Date) {
  const start = new Date(startTime)
  const date = start.toLocaleDateString('en-US', { dateStyle: 'medium' })
  const time = start.toLocaleTimeString('en-US', { timeStyle: 'short' })
  return `${date} | ${time}`
}
