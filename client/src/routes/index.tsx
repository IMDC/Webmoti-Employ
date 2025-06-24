import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    // TODO change this to /home
    const meetingId = 'abc123';
    throw redirect({
      to: '/$id',
      params: { id: meetingId },
    });
  },
});
