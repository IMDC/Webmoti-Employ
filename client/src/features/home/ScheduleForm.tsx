import { IconTrash } from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { z } from 'zod/v4';
import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Input,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { DatePickerInput, getTimeRange, TimeGrid } from '@mantine/dates';
import { useForm } from '@mantine/form';

const ScheduleInterviewSchema = z.object({
  date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // ex: "09:00"
  invites: z.array(z.object({ email: z.email() })),
});

type ScheduleInterview = z.infer<typeof ScheduleInterviewSchema>;

export function ScheduleForm() {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      // default is tomorrow
      date: new Date(Date.now() + 86400000),
      startTime: '09:00',
      invites: [],
    },

    validate: zod4Resolver(ScheduleInterviewSchema),
  });

  function handleSubmit(values: ScheduleInterview) {
    const [hours, minutes] = values.startTime.split(':').map(Number);
    const interviewDateTime = new Date(values.date);
    interviewDateTime.setHours(hours, minutes, 0, 0);

    console.log({ ...values, interviewDateTime });
  }

  const invites = form.getValues().invites.map((_, index) => (
    <Group key={index}>
      <TextInput
        placeholder="Email address"
        withAsterisk
        style={{ flex: 1 }}
        key={form.key(`invites.${index}.email`)}
        {...form.getInputProps(`invites.${index}.email`)}
      />
      {/* <Switch
        label="Interviewer"
        key={form.key(`invites.${index}.interviewer`)}
        {...form.getInputProps(`invites.${index}.interviewer`, { type: 'checkbox' })}
      /> */}
      <ActionIcon color="red" onClick={() => form.removeListItem('invites', index)}>
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  ));

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <DatePickerInput
          withAsterisk
          label="Interview date"
          key={form.key('date')}
          {...form.getInputProps('date')}
        />

        <Input.Wrapper label="Interview time" withAsterisk {...form.getInputProps('startTime')}>
          <TimeGrid
            defaultValue="09:00"
            data={getTimeRange({ startTime: '09:00', endTime: '17:00', interval: '01:00' })}
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
          <Button onClick={() => form.insertListItem('invites', { email: '' })}>
            Add invitation
          </Button>
        </Group>

        {/* the empty group is so the tooltip only appears when hovering the checkbox label*/}
        <Group>
          <Tooltip
            multiline
            w={220}
            label="Select this to open Google Calendar in a new tab after submitting so you can send a calendar event. All the fields will be filled in."
            refProp="rootRef"
          >
            <Checkbox label="Open Google Calendar" />
          </Tooltip>
        </Group>

        <Button type="submit">Schedule interview</Button>
      </Stack>
    </form>
  );
}
