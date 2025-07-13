import { useUser } from '@clerk/clerk-react'
import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Input,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { DatePickerInput, getTimeRange, TimeGrid } from '@mantine/dates'
import { useForm } from '@mantine/form'
import {
  IconAt,
  IconCalendarFilled,
  IconCalendarPlus,
  IconMailFast,
  IconTrash,
} from '@tabler/icons-react'
import { zod4Resolver } from 'mantine-form-zod-resolver'
import { useAppStore } from '@/useAppStore'
import { getHighlightColor, getInterviewLink, handleAppError } from '@/utils/utils'
import { useScheduleInterview } from '../queries'
import { ScheduleInterviewForm } from '../schema'

function openGoogleCalendarTab(
  startTime: Date,
  endTime: Date,
  invites: string[],
  sessionId: string,
) {
  const formatDate = (d: Date) =>
    `${d
      .toISOString()
      .replace(/[-:]|\.\d{3}/g, '')
      .slice(0, 15)}Z`

  const title = encodeURIComponent('WebMoti-Employ Interview')
  const description = encodeURIComponent(
    'You are invited to a virtual interview on the WebMoti-Employ platform.'
    + `\nJoin link: ${getInterviewLink(sessionId)}`,
  )
  const location = encodeURIComponent(window.location.origin)
  const startDateTime = formatDate(startTime)
  const endDateTime = formatDate(endTime)
  const guests = encodeURIComponent(invites.join(','))

  const url = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${title}&details=${description}&location=${location}&dates=${startDateTime}/${endDateTime}&add=${guests}`

  window.open(url, '_blank')
}

interface ScheduleFormProps {
  onSuccess: () => void
}

export function ScheduleForm({ onSuccess }: ScheduleFormProps) {
  const { scheduleInterviewMutation, isScheduleInterviewPending } = useScheduleInterview()
  const { user } = useUser()

  const setError = useAppStore(s => s.setError)
  const isColorblindModeOn = useAppStore(s => s.isColorblindModeOn)

  const form = useForm<ScheduleInterviewForm>({
    mode: 'uncontrolled',
    initialValues: {
      // default is tomorrow
      date: new Date(Date.now() + 86400000),
      startTime: '09:00',
      invites: [],
      openGoogleCalendar: false,
    },

    validate: zod4Resolver(ScheduleInterviewForm),
  })

  async function handleSubmit(values: ScheduleInterviewForm) {
    const [hours, minutes] = values.startTime.split(':').map(Number)
    const startTime = new Date(values.date)
    startTime.setHours(hours, minutes, 0, 0)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

    if (!user) {
      setError({ message: 'User is not set' })
      return
    }

    try {
      const sessionId = await scheduleInterviewMutation({
        creatorId: user.id,
        startTime,
        endTime,
        invites: values.invites,
      })

      if (values.openGoogleCalendar) {
        const inviteEmails = values.invites.map(i => i.email)
        openGoogleCalendarTab(startTime, endTime, inviteEmails, sessionId)
      }

      onSuccess()
    }
    catch (error: unknown) {
      handleAppError(error, setError, 'Failed to schedule interview')
    }
  }

  const invites = form.getValues().invites.map((_, index) => (
    // eslint-disable-next-line react/no-array-index-key
    <Group key={index}>
      <TextInput
        placeholder="Email"
        leftSection={<IconAt size={16} />}
        withAsterisk
        style={{ flex: 1 }}
        key={form.key(`invites.${index}.email`)}
        {...form.getInputProps(`invites.${index}.email`)}
      />
      <Switch
        label="Interviewer"
        key={form.key(`invites.${index}.isInterviewer`)}
        {...form.getInputProps(`invites.${index}.isInterviewer`, { type: 'checkbox' })}
      />
      <ActionIcon
        color={getHighlightColor(isColorblindModeOn)}
        onClick={() => form.removeListItem('invites', index)}
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  ))

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack pl="md" pr="md" pb="sm">
        <DatePickerInput
          withAsterisk
          minDate={new Date()}
          defaultDate={new Date(Date.now() + 86400000)}
          leftSection={<IconCalendarFilled size={16} />}
          label="Interview date"
          key={form.key('date')}
          {...form.getInputProps('date')}
        />

        <Input.Wrapper label="Interview time" withAsterisk {...form.getInputProps('startTime')}>
          <TimeGrid
            defaultValue="09:00"
            data={getTimeRange({ startTime: '09:00', endTime: '16:00', interval: '00:30' })}
            format="12h"
            key={form.key('startTime')}
          />
        </Input.Wrapper>

        <Stack gap="xs">{invites}</Stack>

        <Group justify="center">
          {invites.length === 0 && (
            <Text fw="bold" size="sm">
              You haven't invited anyone
            </Text>
          )}
          <Button
            onClick={() => form.insertListItem('invites', { email: '' })}
            leftSection={<IconMailFast />}
          >
            Add invitation
          </Button>
        </Group>

        {/* the empty group is so the tooltip only appears when hovering the checkbox label */}
        <Group>
          <Tooltip
            multiline
            w={220}
            label="Select this to open Google Calendar in a new tab after submitting so you can send a calendar event. All the fields will be filled in."
            refProp="rootRef"
          >
            <Checkbox
              label="Open Google Calendar"
              key={form.key(`openGoogleCalendar`)}
              {...form.getInputProps(`openGoogleCalendar`, { type: 'checkbox' })}
            />
          </Tooltip>
        </Group>

        <Button
          type="submit"
          loading={isScheduleInterviewPending}
          leftSection={<IconCalendarPlus />}
        >
          Schedule interview
        </Button>
      </Stack>
    </form>
  )
}
