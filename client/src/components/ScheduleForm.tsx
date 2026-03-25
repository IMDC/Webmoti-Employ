import type { ComboboxItem } from '@mantine/core'
import type { NewInterviewInvite } from '@webmoti-employ/shared'
import {
  Autocomplete,
  Button,
  Card,
  Group,
  Input,
  Paper,
  Select,
  Stack,
  Stepper,
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
  IconExternalLink,
  IconPlus,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react'
import { NewInterviewInvite as NewInterviewInviteSchema } from '@webmoti-employ/shared'
import { DateTime } from 'luxon'
import { zod4Resolver } from 'mantine-form-zod-resolver'
import { useState } from 'react'
import { z } from 'zod'
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

// Returns the next available 30-min slot from the time grid, or '09:00' if all have passed
function getDefaultStartTime(): string {
  const now = DateTime.local()
  const nextSlot = interviewTimeRange.find((time) => {
    const [hour, minute] = time.split(':').map(Number)
    return now.set({ hour, minute, second: 0, millisecond: 0 }) >= now
  })
  return nextSlot ?? '09:00'
}

export function ScheduleForm({
  hostId: fixedHostId,
  hostOptions,
  inviteEmailOptions,
  onSchedule,
  isPending,
  onSuccess,
}: ScheduleFormProps) {
  const [useCustomTime, setUseCustomTime] = useState(false)
  const [step, setStep] = useState(0)

  const form = useForm<ScheduleFormSchema>({
    mode: 'uncontrolled',
    initialValues: {
      hostId: fixedHostId ?? '',
      date: DateTime.local().toISODate(),
      startTime: getDefaultStartTime(),
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

    if (localDate < DateTime.local()) {
      form.setFieldError('startTime', 'Time is in the past')
      return
    }
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

  function getMinTimeForToday(selectedDate: string): string | undefined {
    const now = DateTime.local()
    const selected = DateTime.fromISO(selectedDate, { zone: 'local' })

    if (!now.hasSame(selected, 'day'))
      return undefined

    return now.toFormat('HH:mm')
  }

  const invites = form.values.invites

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stepper active={step} onStepClick={setStep} size="sm" mb="lg">
        <Stepper.Step label="Date/Time" icon={<IconCalendarFilled size={18} />}>
          <Stack mt="md">
            <DatePickerInput
              withAsterisk
              minDate={DateTime.local().toJSDate()}
              defaultDate={DateTime.local().toJSDate()}
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
                        min={getMinTimeForToday(form.values.date)}
                        key={form.key('startTime')}
                        value={form.getInputProps('startTime').value}
                        onChange={e => form.getInputProps('startTime').onChange(e.currentTarget.value ? `${e.currentTarget.value}:00` : '')}
                      />
                    )
                  : (
                      <TimeGrid
                        defaultValue={getDefaultStartTime()}
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

            <Group justify="flex-end" mt="sm">
              <Button onClick={() => setStep(1)} rightSection={<IconUsers size={16} />}>
                Next
              </Button>
            </Group>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Invitations" icon={<IconUsers size={18} />}>
          <Stack mt="md" gap="md">
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

            <Text fw={600} size="sm">Invitations</Text>

            {invites.length === 0 && (
              <Paper p="lg" radius="md" withBorder ta="center">
                <Text c="dimmed" size="sm">No participants invited yet</Text>
              </Paper>
            )}

            {invites.map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <Card key={index} padding="sm" radius="md" withBorder>
                <Group wrap="nowrap" gap="sm">
                  {inviteEmailOptions
                    ? (
                        <Autocomplete
                          placeholder="Email address"
                          leftSection={<IconAt size={16} />}
                          data={inviteEmailOptions}
                          flex={1}
                          key={form.key(`invites.${index}.email`)}
                          {...form.getInputProps(`invites.${index}.email`)}
                        />
                      )
                    : (
                        <TextInput
                          placeholder="Email address"
                          leftSection={<IconAt size={16} />}
                          flex={1}
                          key={form.key(`invites.${index}.email`)}
                          {...form.getInputProps(`invites.${index}.email`)}
                        />
                      )}
                  <Switch
                    label="Interviewer"
                    size="sm"
                    key={form.key(`invites.${index}.isInterviewer`)}
                    {...form.getInputProps(`invites.${index}.isInterviewer`, { type: 'checkbox' })}
                  />
                  <Tooltip label="Remove invite">
                    <Button
                      variant="subtle"
                      color="red"
                      size="compact-sm"
                      aria-label="Remove invite"
                      onClick={() => form.removeListItem('invites', index)}
                    >
                      <IconTrash size={16} />
                    </Button>
                  </Tooltip>
                </Group>
              </Card>
            ))}

            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={() => form.insertListItem('invites', { email: '', isInterviewer: false })}
            >
              Add invitation
            </Button>

            <Tooltip
              multiline
              w={220}
              label="Opens Google Calendar in a new tab after scheduling, with all the fields pre-filled."
            >
              <Paper p="sm" radius="md" withBorder style={{ cursor: 'default' }}>
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconExternalLink size={16} style={{ opacity: 0.6 }} />
                    <Text size="sm">Create Google Calendar invite</Text>
                  </Group>
                  <Switch
                    size="sm"
                    key={form.key('openGoogleCalendar')}
                    {...form.getInputProps('openGoogleCalendar', { type: 'checkbox' })}
                  />
                </Group>
              </Paper>
            </Tooltip>

            <Group justify="space-between" mt="sm">
              <Button variant="default" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button
                type="submit"
                loading={isPending}
                leftSection={<IconCalendarPlus size={16} />}
              >
                Schedule interview
              </Button>
            </Group>
          </Stack>
        </Stepper.Step>
      </Stepper>
    </form>
  )
}
