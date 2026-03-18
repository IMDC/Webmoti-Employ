import type { ComboboxItem } from '@mantine/core'
import type { NewInterviewInvite } from '@webmoti-employ/shared'
import {
  Autocomplete,
  Button,
  Checkbox,
  Group,
  Input,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { DatePickerInput, getTimeRange, TimeGrid, TimeInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import {
  IconAt,
  IconCalendarFilled,
  IconCalendarPlus,
  IconClock,
  IconMailFast,
} from '@tabler/icons-react'
import { NewInterviewInvite as NewInterviewInviteSchema } from '@webmoti-employ/shared'
import { DateTime } from 'luxon'
import { zod4Resolver } from 'mantine-form-zod-resolver'
import { useState } from 'react'
import { z } from 'zod'
import { DeleteButton } from '@/components/DeleteButton'
import { notifyError } from '@/utils/utils'

const ScheduleFormSchema = z.object({
  hostId: z.string().min(1, 'Host is required'),
  date: z.iso.date(),
  startTime: z.iso.time(),
  invites: z.array(NewInterviewInviteSchema),
  openGoogleCalendar: z.boolean(),
})

// eslint-disable-next-line ts/no-redeclare
type ScheduleFormSchema = z.infer<typeof ScheduleFormSchema>

export interface ScheduleData {
  hostId: string
  startTime: Date
  endTime: Date
  invites: NewInterviewInvite[]
  openGoogleCalendar: boolean
}

interface ScheduleFormProps {
  /** Pre-set host ID (dashboard mode hides host selector) */
  hostId?: string
  /** User options for host dropdown (admin mode) */
  hostOptions?: ComboboxItem[]
  /** Email suggestions for invite autocomplete (admin mode) */
  inviteEmailOptions?: string[]
  /** Called when form is submitted. Should return sessionId. */
  onSchedule: (data: ScheduleData) => Promise<string>
  isPending: boolean
  /** Called after successful schedule */
  onSuccess: (sessionId: string, data: ScheduleData) => void
}

const interviewTimeRange = getTimeRange({ startTime: '09:00', endTime: '16:00', interval: '00:30' })

export function ScheduleForm({
  hostId: fixedHostId,
  hostOptions,
  inviteEmailOptions,
  onSchedule,
  isPending,
  onSuccess,
}: ScheduleFormProps) {
  const [useCustomTime, setUseCustomTime] = useState(false)

  const form = useForm<ScheduleFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      hostId: fixedHostId ?? '',
      date: DateTime.local().plus({ days: 1 }).toISODate(),
      startTime: '09:00:00',
      invites: [],
      openGoogleCalendar: false,
    },
    validate: zod4Resolver(ScheduleFormSchema),
  })

  async function handleSubmit(values: ScheduleFormSchema) {
    // zod4Resolver doesn't actually return the parsed values, so we need to parse again
    const parsed = ScheduleFormSchema.safeParse(values)
    if (!parsed.success) {
      notifyError('Invalid form data', z.flattenError(parsed.error))
      return
    }
    const { hostId, date, startTime, invites, openGoogleCalendar } = parsed.data

    const [hour, minute] = startTime.split(':').map(Number)
    const localDate = DateTime.fromISO(date, { zone: 'local' }).set({ hour, minute })
    const startTimeDate = localDate.toUTC().toJSDate()
    const endTimeDate = localDate.plus({ hours: 1 }).toUTC().toJSDate()

    const data: ScheduleData = {
      hostId,
      startTime: startTimeDate,
      endTime: endTimeDate,
      invites,
      openGoogleCalendar,
    }

    try {
      const sessionId = await onSchedule(data)
      onSuccess(sessionId, data)
      form.reset()
    }
    catch (error: unknown) {
      notifyError('Failed to schedule interview', error)
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
      {inviteEmailOptions
        ? (
            <Autocomplete
              placeholder="Email"
              leftSection={<IconAt size={16} />}
              data={inviteEmailOptions}
              withAsterisk
              flex={1}
              key={form.key(`invites.${index}.email`)}
              {...form.getInputProps(`invites.${index}.email`)}
            />
          )
        : (
            <TextInput
              placeholder="Email"
              leftSection={<IconAt size={16} />}
              withAsterisk
              flex={1}
              key={form.key(`invites.${index}.email`)}
              {...form.getInputProps(`invites.${index}.email`)}
            />
          )}
      <Switch
        label="Interviewer"
        key={form.key(`invites.${index}.isInterviewer`)}
        {...form.getInputProps(`invites.${index}.isInterviewer`, { type: 'checkbox' })}
      />
      <DeleteButton
        label="Remove invite"
        onClick={() => form.removeListItem('invites', index)}
      />
    </Group>
  ))

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        {/* Host selector (admin mode only) */}
        {!fixedHostId && hostOptions && (
          <Select
            label="Host"
            placeholder="Select a host"
            data={hostOptions}
            searchable
            withAsterisk
            key={form.key('hostId')}
            {...form.getInputProps('hostId')}
          />
        )}

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
          <Stack gap="xs">
            {useCustomTime
              ? (
                  <TimeInput
                    leftSection={<IconClock size={16} />}
                    key={form.key('startTime')}
                    value={form.getInputProps('startTime').value}
                    onChange={e => form.getInputProps('startTime').onChange(e.currentTarget.value ? `${e.currentTarget.value}:00` : '')}
                  />
                )
              : (
                  <TimeGrid
                    defaultValue="09:00:00"
                    data={interviewTimeRange}
                    disableTime={getDisabledTimesForToday(form.values.date)}
                    format="12h"
                    key={form.key('startTime')}
                    value={form.getInputProps('startTime').value}
                    onChange={form.getInputProps('startTime').onChange}
                  />
                )}
            <Button
              variant="subtle"
              size="compact-xs"
              onClick={() => setUseCustomTime(prev => !prev)}
            >
              {useCustomTime ? 'Use time grid' : 'Custom time'}
            </Button>
          </Stack>
        </Input.Wrapper>

        <Stack gap="xs">{invites}</Stack>

        <Group justify="center">
          {invites.length === 0 && (
            <Text fw="bold" size="sm">
              No invites added yet
            </Text>
          )}
          <Button
            onClick={() => form.insertListItem('invites', { email: '', isInterviewer: false })}
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
              key={form.key('openGoogleCalendar')}
              {...form.getInputProps('openGoogleCalendar', { type: 'checkbox' })}
            />
          </Tooltip>
        </Group>

        <Button
          type="submit"
          loading={isPending}
          leftSection={<IconCalendarPlus />}
        >
          Schedule interview
        </Button>
      </Stack>
    </form>
  )
}
