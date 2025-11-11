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
import { DateTime } from 'luxon'
import { zod4Resolver } from 'mantine-form-zod-resolver'
import z from 'zod'
import { useUser } from '@/features/auth/hooks/useUserStore'
import { useAppActions, useAppIsColorblindModeOn } from '@/useAppStore'
import { openGoogleCalendarTab } from '@/utils/calendar'
import { getHighlightColor, handleAppError } from '@/utils/utils'
import { useScheduleInterview } from '../queries'
import { ScheduleInterviewForm } from '../schema'

interface ScheduleFormProps {
  onSuccess: () => void
}

export function ScheduleForm({ onSuccess }: ScheduleFormProps) {
  const { scheduleInterviewMutation, isScheduleInterviewPending } = useScheduleInterview()
  const user = useUser()

  const { setError } = useAppActions()
  const isColorblindModeOn = useAppIsColorblindModeOn()

  const interviewTimeRange = getTimeRange({ startTime: '09:00', endTime: '16:00', interval: '00:30' })

  const form = useForm<ScheduleInterviewForm>({
    mode: 'uncontrolled',
    initialValues: {
      // default is tomorrow
      date: DateTime.local().plus({ days: 1 }).toISODate(),
      startTime: '09:00:00',
      invites: [],
      openGoogleCalendar: false,
    },

    validate: zod4Resolver(ScheduleInterviewForm),
  })

  async function handleSubmit(values: ScheduleInterviewForm) {
    // zod4Resolver doesn't actually return the parsed values, so we need to parse again
    const parsed = ScheduleInterviewForm.safeParse(values)
    if (!parsed.success) {
      setError({ message: 'Invalid form data', details: z.flattenError(parsed.error) })
      return
    }
    const { date, startTime, invites, openGoogleCalendar } = parsed.data

    const [hour, minute] = startTime.split(':').map(Number)
    const localDate = DateTime.fromISO(date, { zone: 'local' }).set({ hour, minute })
    const startTimeDate = localDate.toUTC().toJSDate()
    const endTimeDate = localDate.plus({ hours: 1 }).toUTC().toJSDate()

    try {
      const sessionId = await scheduleInterviewMutation({
        creatorId: user.id,
        startTime: startTimeDate,
        endTime: endTimeDate,
        invites,
        isInstant: false,
      })

      if (openGoogleCalendar) {
        const inviteEmails = invites.map(i => i.email)
        openGoogleCalendarTab(startTimeDate, endTimeDate, inviteEmails, sessionId)
      }

      onSuccess()
    }
    catch (error: unknown) {
      handleAppError(error, setError, 'Failed to schedule interview')
    }
  }

  function getDisabledTimesForToday(selectedDate: string): string[] {
    const now = DateTime.local()
    const selected = DateTime.fromISO(selectedDate, { zone: 'local' })

    if (!now.hasSame(selected, 'day'))
      return []

    return interviewTimeRange
      .map((time) => {
        const [hour, minute] = time.split(':').map(Number)
        return selected.set({ hour, minute, second: 0, millisecond: 0 })
      })
      .filter(dt => dt < now)
      .map(dt => dt.toFormat('HH:mm'))
  }

  const invites = form.values.invites.map((_, index) => (
    // eslint-disable-next-line react/no-array-index-key
    <Group key={index}>
      <TextInput
        placeholder="Email"
        leftSection={<IconAt size={16} />}
        withAsterisk
        flex={1}
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
          minDate={DateTime.local().toJSDate()}
          defaultDate={DateTime.local().plus({ days: 1 }).toJSDate()}
          leftSection={<IconCalendarFilled size={16} />}
          label="Interview date"
          key={form.key('date')}
          {...form.getInputProps('date')}
        />

        <Input.Wrapper label="Interview time" withAsterisk {...form.getInputProps('startTime')}>
          <TimeGrid
            defaultValue="09:00:00"
            data={interviewTimeRange}
            disableTime={getDisabledTimesForToday(form.values.date)}
            format="12h"
            key={form.key('startTime')}
            value={form.getInputProps('startTime').value}
            onChange={form.getInputProps('startTime').onChange}
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
